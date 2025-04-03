from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import threading
import queue
import time
import logging

# 定数定義
MODEL_NAME = "llama-3.2-1b-instruct"
# MODEL_NAME = "elyza-japanese-llama-2-7b-fast-instruct"
API_URL = "http://localhost:1234/v1/chat/completions"
TEMPERATURE = 0.1

READ_MORE_SELECTOR = 'a.btn-default.btn-large.btn-radius.btn-shadow.btn-block.btn-fixation'
ARTICLE_TEXT_SELECTOR = '.article-text'
BASE_URL = "https://news.goo.ne.jp"
# READ_MORE_SELECTOR = '#uamods-pickup > div[data-ual-view-type="digest"] > a'
# ARTICLE_TEXT_SELECTOR = '#uamods > div.article_body.highLightSearchTarget > div > p'
# BASE_URL = "https://news.yahoo.co.jp"

# Flaskアプリケーションの初期化
app = Flask(__name__)
CORS(app)

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# リクエストキューの作成
request_queue = queue.Queue()

def fetch_page_content(url):
    """ 指定されたURLのページ内容を取得 """
    try:
        res = requests.get(url)
        res.raise_for_status()
        return BeautifulSoup(res.text, 'html.parser')
    except requests.RequestException as e:
        raise RuntimeError(f"ページの取得に失敗しました: {str(e)}")

def extract_article_text(soup):
    """ BeautifulSoupオブジェクトから記事本文を抽出 """
    article_content = soup.select_one(ARTICLE_TEXT_SELECTOR)
    return article_content.get_text(strip=True) if article_content else None

def follow_read_more_link(soup):
    """ 「続きを読む」リンクを辿り、新しいページの内容を取得 """
    read_more_link = soup.select_one(READ_MORE_SELECTOR)
    if read_more_link:
        read_more_href = read_more_link.get('href')
        if read_more_href and not read_more_href.startswith('http'):
            read_more_href = f"{BASE_URL}{read_more_href}"
        return fetch_page_content(read_more_href)
    return soup

def fetch_article_text(url):
    """ 記事URLから本文を取得し、必要に応じて「続きを読む」リンクを辿る """
    try:
        soup = fetch_page_content(url)
        # 続きを読むリンクがある場合は辿る
        try:
            soup = follow_read_more_link(soup)
        except Exception as e:
            pass
        article_text = extract_article_text(soup)
        return article_text if article_text else "記事本文が見つかりませんでした"
    except RuntimeError as e:
        return str(e)

def clean_response(response_text):
    """ LLMからの応答テキストから不要なフレーズを削除して整形 """
    unwanted_phrases = ["見出し：", "<think>", "</think>", "AIによる見出し提案:", "以下の通りです。"]
    for phrase in unwanted_phrases:
        response_text = response_text.replace(phrase, "").strip()
    # 複数行がある場合、最初の行のみを返す
    return response_text.split("\n")[0].strip().split("。")[0].strip()
    

def generate_headline(article_text):
    """ ニュース記事から要約を生成 """
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
                "messages": [{"role": "user", "content": prompt}],  # プロンプトを含むメッセージ
                "temperature": TEMPERATURE  # 出力の多様性を制御するパラメータ
            },
            timeout=200#タイムアウトを10秒に設定
        )
        response.raise_for_status()  # ステータスコードがエラーの場合例外を発生
        # レスポンスから要約を抽出して返す
        ai_response = response.json()["choices"][0]["message"]["content"]

        # 適切性と新しい見出しを抽出
        lines = ai_response.split("\n")
        is_relevant = None
        new_headline = None

        for line in lines:
            if line.startswith("適切性:"):
                is_relevant = line.replace("適切性:", "").strip()
            elif line.startswith("新しい見出し:"):
                new_headline = line.replace("新しい見出し:", "").strip()

        # 結果を返す
        return {
            "is_relevant": is_relevant,
            "new_headline": new_headline
        }
    except requests.Timeout:
        # タイムアウト時のエラーメッセージを返す
        return "要約生成に失敗しました: リクエストがタイムアウトしました"
    except requests.RequestException as e:
        # その他のリクエストエラー時のエラーメッセージを返す
        return f"要約生成に失敗しました: {str(e)}"

def process_requests():
    """ キュー内のリクエストを順次処理 """
    while True:
        try:
            # キューからリクエストデータを取得
            article_text, original_headline, result_queue = request_queue.get()
            logging.info("リクエスト処理を開始します")
            
            # 要約を生成
            headline = generate_headline(article_text, original_headline)
            
            # 結果を返す
            result_queue.put(headline)
            logging.info("リクエスト処理が完了しました")
        except Exception as e:
            logging.error(f"リクエスト処理中にエラーが発生しました: {str(e)}")
        finally:
            request_queue.task_done()

# スプーラー用のスレッドを開始
threading.Thread(target=process_requests, daemon=True).start()

@app.route("/headline", methods=["POST"])
def headline_api():
    """ APIエンドポイント：記事URLを受け取り、要約を生成して返す """
    # リクエストデータを取得
    data = request.json
    article_url = data.get("url", "")  # URLが指定されているか確認
    original_headline = data.get("original_headline", "")
    print(f"受け取った元の見出し: {original_headline}")
    
    if not article_url:
        # URLが指定されていない場合はエラーレスポンスを返す
        return jsonify({"headline": "記事URLが指定されていません"}), 400
    
    if not original_headline:
        # original_headlineが指定されていない場合はエラーレスポンスを返す
        return jsonify({"headline": "元の見出しが指定されていません"}), 400

    # 記事本文を取得
    article_text = fetch_article_text(article_url)
    if "失敗" in article_text:
        # 記事本文の取得に失敗した場合はエラーレスポンスを返す
        return jsonify({"headline": article_text}), 500

    # 結果を受け取るためのキューを作成
    result_queue = queue.Queue()

    # リクエストをキューに追加
    request_queue.put((article_text, original_headline, result_queue))

    # 結果を待機
    result = result_queue.get()

    # 要約をJSON形式で返す
    return jsonify({"headline": result["headline"], "judge": result["is_relevant"]})

if __name__ == "__main__":
    # Flaskアプリケーションをポート8000で起動
    app.run(port=8000)