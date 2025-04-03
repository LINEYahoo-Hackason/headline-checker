from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import threading
import queue
import time
import logging

# 定数定義
MODEL_NAME = "elyza-japanese-llama-2-7b-fast-instruct"
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

def extract_clickbait_headline(soup):
    """ BeautifulSoupオブジェクトから釣り見出しを抽出 """
    title_element = soup.title  # titleタグを取得
    return title_element.get_text(strip=True) if title_element else "釣り見出しが見つかりませんでした"

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
        article_text = article_text if article_text else "記事本文が見つかりませんでした"
        article_title = extract_clickbait_headline(soup).split(" - ")[0]  # タイトルを取得し、不要な部分を削除
        return article_text, article_title
    except RuntimeError as e:
        return str(e)

def clean_response(response_text):
    """ LLMからの応答テキストから不要なフレーズを削除して整形 """
    unwanted_phrases = ["見出し：", "<think>", "</think>", "AIによる見出し提案:", "以下の通りです。"]
    for phrase in unwanted_phrases:
        response_text = response_text.replace(phrase, "").strip()
    # 複数行がある場合、最初の行のみを返す
    return response_text.split("\n")[0].strip().split("。")[0].strip()

def generate_headline(article_text, article_title):
    """ ニュース記事から要約を生成 """
    # プロンプトの定義：ニュース記事を要約するための指示を含む
    prompt = (
        f"""
        あなたはニュース記事要約し、正しい見出しを生成する優秀なAIです。
        釣り見出しは絶対に生成禁止です。
        限られた時間で効率的に情報を得るため、見出しの正確性を重視してください。
        記事内容を必ず16字以内で確実に要約して必ず16字以内で出力してください。
        誇張や感情的表現は避け、客観的に要点を伝えてください。
        重要な情報を優先し、冗長な表現は省いてください。
        記事の内容を正確に反映し、誤解を招く表現は避けてください。
        PREP法(Point, Reason, Example, Point)のPointを意識してください。
        必ず主語を含めてください。
        5W1H(Who, What, When, Where, Why, How)のWho, Whatを意識してください。
        現時点の釣り見出し：
        {article_title}
        記事内容：
        {article_text}
        要約：
        (回答は要約文のみです。指示への返答や説明文は絶対に書かないでください。)
        """
    ).replace("    ", "")  # インデントを削除
    try:
        # APIリクエストを送信して要約を生成（タイムアウトを設定）
        response = requests.post(
            API_URL,
            json={
                "model": MODEL_NAME,  # 使用するモデル名
                "messages": [{"role": "user", "content": prompt}],  # プロンプトを含むメッセージ
                "temperature": TEMPERATURE  # 出力の多様性を制御するパラメータ
            },
            timeout=10  # タイムアウトを10秒に設定
        )
        response.raise_for_status()  # ステータスコードがエラーの場合例外を発生
        # レスポンスから要約を抽出して返す
        return clean_response(response.json()["choices"][0]["message"]["content"])
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
            article_text, article_title, result_queue = request_queue.get()
            logging.info("リクエスト処理を開始します")
            
            # 要約を生成
            headline = generate_headline(article_text, article_title)
            
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
    if not article_url:
        # URLが指定されていない場合はエラーレスポンスを返す
        return jsonify({"headline": "記事URLが指定されていません"}), 400

    # 記事本文と釣り見出しを取得
    article_text, article_title = fetch_article_text(article_url)
    if "失敗" in article_text or not article_title:
        # 記事本文またはタイトルの取得に失敗した場合はエラーレスポンスを返す
        return jsonify({"headline": article_text}), 500

    # 結果を受け取るためのキューを作成
    result_queue = queue.Queue()

    # リクエストをキューに追加
    request_queue.put((article_text, article_title, result_queue))

    # 結果を待機
    headline = result_queue.get()

    # 要約をJSON形式で返す
    return jsonify({"headline": headline})

if __name__ == "__main__":
    # Flaskアプリケーションをポート8000で起動
    app.run(port=8000)