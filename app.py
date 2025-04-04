from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import logging
from urllib.robotparser import RobotFileParser
from urllib.parse import urlparse, urljoin
from datetime import datetime, timedelta

# 定数定義
MODEL_NAME = "llama-3.2-1b-instruct"
# MODEL_NAME = "elyza-japanese-llama-2-7b-fast-instruct"
API_URL = "http://localhost:1234/v1/chat/completions"
TEMPERATURE = 0.1


# Flaskアプリケーションの初期化
app = Flask(__name__)
CORS(app)

# ログ設定
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# robots.txt のキャッシュを管理する辞書
robots_cache = {}


def is_crawl_allowed(url):
    """指定されたURLがrobots.txtでクロール許可されているか確認"""
    try:
        # URLのドメイン部分を取得
        parsed_url = urlparse(url)
        robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"

        # キャッシュを確認
        if robots_url in robots_cache:
            cache_entry = robots_cache[robots_url]
            # キャッシュが1日以内なら再利用
            if datetime.now() - cache_entry["timestamp"] < timedelta(days=1):
                logging.info(f"キャッシュからrobots.txtを使用: {robots_url}")
                return cache_entry["can_fetch"]

        # robots.txt を解析
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.read()

        # クロールが許可されているか確認
        can_fetch = rp.can_fetch("*", url)

        # キャッシュに保存
        robots_cache[robots_url] = {
            "timestamp": datetime.now(),
            "can_fetch": can_fetch,
        }

        return can_fetch
    except Exception as e:
        logging.error(f"robots.txt の確認中にエラーが発生しました: {str(e)}")
        return False


def fetch_page_content(url):
    """指定されたURLのページ内容を取得"""
    try:
        res = requests.get(url)
        res.raise_for_status()

        # レスポンスのエンコーディングを自動検出 一部サイトで文字化けする場合があるため
        if res.encoding == "ISO-8859-1":  # デフォルトがISO-8859-1の場合が多い
            res.encoding = res.apparent_encoding  # 正しいエンコーディングを推測して設定

        return BeautifulSoup(res.text, "html.parser")
    except requests.RequestException as e:
        raise RuntimeError(f"ページの取得に失敗しました: {str(e)}")


def extract_article_text(soup):
    """BeautifulSoupオブジェクトから記事本文を抽出"""
    # セレクタを優先順位順に定義
    selectors = [
        ".article-text",  # gooニュース用の例
        ".article_body",  # yahoo japanニュース用の例
        ".main-content",  # 他のサイト用の例
        ".post-content",  # 他のサイト用の例
        ".entry-content",  # WordPress用の例
        ".post-body",  # 他のサイト用の例
        ".article-body",  # 他のサイト用の例
        "#detail_area",  # 他のサイト用の例
        ".content",  # 一般的なクラス名
        ".entry",  # 一般的なクラス名
        "article",  # 一般的なHTMLタグ
        "main",  # 一般的なHTMLタグ
        "section",  # 一般的なHTMLタグ
    ]
    # セレクタを順番に試す
    for selector in selectors:
        # print(f"記事本文を抽出するセレクタ: {selector}")  # デバッグ用
        article_content = soup.select_one(selector)
        if article_content and article_content.get_text(strip=True):
            print(f"記事本文を抽出しました: {selector}")  # デバッグ用
            print(f"記事本文: {article_content.get_text(strip=True)}")  # デバッグ用
            return article_content.get_text(strip=True)

    # フォールバック処理: ページ全体のテキストを取得
    logging.warning("該当する記事本文が見つかりませんでした。フォールバック処理を実行します。")
    # ページ全体のテキストを取得し、改行で分割して最も長い段落を返す
    paragraphs = [p.strip() for p in soup.get_text().split("\n") if p.strip()]
    if paragraphs:
        logging.info("フォールバックで最も長い段落を返します。")
        return max(paragraphs, key=len)  # 最も長い段落を返す

    return "記事本文が見つかりませんでした"


def follow_read_more_link(soup, base_url):
    """「続きを読む」リンクを辿り、新しいページの内容を取得"""
    # 「続きを読む」や「記事全文」を含むリンクを探す
    read_more_link = soup.find(
        "a", string=lambda text: text and ("続きを読む" in text or "記事全文" in text)
    )

    if read_more_link:
        print(f"read_more_linkを辿ります: {read_more_link}")  # デバッグ用
        read_more_href = read_more_link.get("href")
        if read_more_href and not read_more_href.startswith("http"):
            # 相対URLを絶対URLに変換
            read_more_href = urljoin(base_url, read_more_href)
        return fetch_page_content(read_more_href)
    return soup


def fetch_article_text(url):
    """記事URLから本文を取得し、必要に応じて「続きを読む」リンクを辿る"""
    # robots.txt を確認
    if not is_crawl_allowed(url):
        return "このURLはrobots.txtでクロールが禁止されています"

    try:
        soup = fetch_page_content(url)
        # 続きを読むリンクがある場合は辿る
        try:
            soup = follow_read_more_link(soup, url)
        except Exception as e:
            pass
        article_text = extract_article_text(soup)
        article_text = (
            article_text if article_text else "記事本文が見つかりませんでした"
        )
        return article_text
    except RuntimeError as e:
        return str(e)


def clean_response(response_text):
    """LLMからの応答テキストから不要なフレーズを削除して整形"""
    unwanted_phrases = [
        "見出し：",
        "<think>",
        "</think>",
        "AIによる見出し提案:",
        "以下の通りです。",
    ]
    for phrase in unwanted_phrases:
        response_text = response_text.replace(phrase, "").strip()
    # 複数行がある場合、最初の行のみを返す
    return response_text.split("\n")[0].strip().split("。")[0].strip()


def generate_headline(article_text, original_headline):
    """ニュース記事から要約を生成"""
    # プロンプトの定義：ニュース記事を要約するための指示を含む
    # prompt = (
    #     f"""
    #     あなたは優秀なニュース記事要約AIです。
    #     回答は要約文のみです。指示への返答や説明文は絶対に書かないでください。
    #     記事内容を必ず16字以内で確実に要約して必ず16字以内で出力してください。
    #     誇張や感情的表現は避け、客観的に要点を伝えてください。
    #     重要な情報を優先し、冗長な表現は省いてください。
    #     記事の内容を正確に反映し、誤解を招く表現は避けてください。
    #     PREP法(Point, Reason, Example, Point)のPointを意識してください。
    #     必ず主語を含めてください。
    #     5W1H(Who, What, When, Where, Why, How)のWho, Whatを意識してください。
    #     記事内容：
    #     {article_text}
    #     要約：
    #     """
    # )
    prompt = (
        "あなたは優秀なライターです。以下のニュース記事に基づいて次のタスクを実行してください：\n"
        "1. 元の見出しが記事内容に適切かどうかを判定してください。\n"
        "2. 記事内容に基づいて新しい見出しを生成してください。\n"
        "- 重要な情報を含めてください。\n"
        "- 読者の興味を引くような表現を心がけてください。\n"
        "- 虚偽の内容を含めないでください。\n"
        "- 見出しは20字程度にしてください\n"
        "- 単語ではなく、文で出力してください\n\n"
        f"元の見出し: {original_headline}\n"
        f"記事内容：\n{article_text}\n\n"
        "出力形式:\n"
        "適切性: (適切 または 不適切)\n"
        "新しい見出し: (生成された見出し)"
    )
    try:
        # APIリクエストを送信して要約を生成（タイムアウトを設定）
        response = requests.post(
            API_URL,
            json={
                "model": MODEL_NAME,  # 使用するモデル名
                "messages": [
                    {"role": "user", "content": prompt}
                ],  # プロンプトを含むメッセージ
                "temperature": TEMPERATURE,  # 出力の多様性を制御するパラメータ
            },
            timeout=200,  # タイムアウトを10秒に設定
        )
        response.raise_for_status()  # ステータスコードがエラーの場合例外を発生
        # レスポンスから要約を抽出して返す
        ai_response = response.json()["choices"][0]["message"]["content"]

        # 適切性と新しい見出しを抽出articleUrl
        lines = ai_response.split("\n")
        is_relevant = None
        new_headline = None

        print(f"AIの応答: {lines}")
        for line in lines:
            if line.startswith("1. "):
                is_relevant = line.replace("1. ", "").strip()
            if line.startswith("適切性:"):
                is_relevant = line.replace("適切性:", "").strip()
            if line.startswith("1. 適切性:"):
                is_relevant = line.replace("1. 適切性:", "").strip()
            if line.startswith("2. "):
                new_headline = line.replace("2. ", "").strip()
            if line.startswith("新しい見出し:"):
                new_headline = line.replace("新しい見出し:", "").strip()
            if line.startswith("2. 新しい見出し:"):
                new_headline = line.replace("2. 新しい見出し:", "").strip()

        # 結果を返す
        return {"is_relevant": is_relevant, "new_headline": new_headline}
    except requests.Timeout:
        # タイムアウト時のエラーメッセージを返す
        return "要約生成に失敗しました: リクエストがタイムアウトしました"
    except requests.RequestException as e:
        # その他のリクエストエラー時のエラーメッセージを返す
        return f"要約生成に失敗しました: {str(e)}"


@app.route("/headline", methods=["POST"])
def headline_api():
    """APIエンドポイント：記事URLを受け取り、要約を生成して返す"""
    # リクエストデータを取得
    data = request.json
    article_url = data.get("url", "")  # URLが指定されているか確認
    original_headline = data.get("original_headline", "")
    print(f"受け取った元の見出し: {original_headline}, URL: {article_url}")  # デバッグ用

    if not article_url:
        # URLが指定されていない場合はエラーレスポンスを返す
        return jsonify({"headline": "記事URLが指定されていません"}), 400

    # 記事本文と釣り見出しを取得
    article_text = fetch_article_text(article_url)
    if "失敗" in article_text or not original_headline:
        # 記事本文またはタイトルの取得に失敗した場合はエラーレスポンスを返す
        return jsonify({"headline": article_text}), 500

    # 要約を生成
    try:
        headline = generate_headline(article_text, original_headline)
        print(f"生成された見出し: {headline}")
    except Exception as e:
        logging.error(f"要約生成中にエラーが発生しました: {str(e)}")
        return jsonify({"headline": "要約生成に失敗しました"}), 500

    # 要約をJSON形式で返す
    return jsonify(
        {"headline": headline["new_headline"], "judge": headline["is_relevant"]}
    )


if __name__ == "__main__":
    # Flaskアプリケーションをポート8000で起動
    app.run(port=8000, threaded=True)
