from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

# 定数定義
MODEL_NAME = "elyza-japanese-llama-2-7b-fast-instruct"
API_URL = "http://localhost:1234/v1/chat/completions"
TEMPERATURE = 0.1

# Flaskアプリケーションの初期化
app = Flask(__name__)
CORS(app)

def fetch_article_text(url):
    """ 記事URLから本文を取得し、必要に応じて「続きを読む」リンクを辿る """
    try:
        # 記事ページを取得
        res = requests.get(url)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')

        # 「続きを読む」リンクがある場合、その先のページを取得
        read_more_link = soup.select_one('a.btn-default.btn-large.btn-radius.btn-shadow.btn-block.btn-fixation')
        headline_text = read_more_link.get_text(strip=True) if read_more_link else "見出しが見つかりませんでした"
        if read_more_link:
            read_more_href = read_more_link.get('href')
            if read_more_href and not read_more_href.startswith('http'):
                read_more_href = f"https://news.goo.ne.jp{read_more_href}"
            res = requests.get(read_more_href)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, 'html.parser')

        # 記事本文を抽出
        article_content = soup.select_one('.article-text')
        article_text = article_content.get_text(strip=True) if article_content else "記事本文が見つかりませんでした"

        # 見出しと本文を辞書形式で返す
        return {"headline": headline_text, "article": article_text}
    except Exception as e:
        return {"headline": None, "article": f"記事の取得に失敗しました：{str(e)}"}

def clean_response(response_text):
    """ LLMからの応答テキストから不要なフレーズを削除して整形 """
    unwanted_phrases = ["見出し：", "<think>", "</think>", "AIによる見出し提案:", "以下の通りです。"]
    for phrase in unwanted_phrases:
        response_text = response_text.replace(phrase, "").strip()
    # 複数行がある場合、最初の行のみを返す
    return response_text.split("\n")[0].strip()

def is_headline_relevant_llm(article_data):
    """LLMを使用して見出しと本文の関連性を判定"""
    prompt = (
        f"以下のニュース記事の見出しが本文に適切かどうかを判定してください。\n\n"
        f"見出し: {article_data["headline"]}\n\n"
        f"本文: {article_data["article"]}\n\n"
        "見出しが本文に適切であれば「適切」と答え、不適切であれば「不適切」と答えてください。"
    )
    response = requests.post(API_URL, json={
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": TEMPERATURE
    })
    result = response.json()["choices"][0]["message"]["content"]
    return "適切" in result

def generate_headline(article_data):
    """ ニュース記事から要約を生成 """
    # prompt = (
    #     "以下のニュース記事を約100文字以内で簡潔に要約してください。\n"
    #     "- 必ず主語を明確にし、「誰が何をしたか」「何が起こったか」を含めてください。\n"
    #     "- 回答は要約文のみです。指示への返答や説明文は絶対に書かないでください。\n"
    #     "- 誇張や感情的表現は避け、客観的に要点を伝えてください。\n\n"
    #     f"記事内容：\n{article_text}\n\n"
    #     "要約："
    # )
    prompt = (
        "あなたは優秀なライターです。以下のニュース記事に最適な見出しを付けてください\n"
        "- 重要な情報を含めてください。\n"
        "- 読者の興味を引くような表現を心がけてください。\n"
        "- 虚偽の内容を含めないでください。\n"
        "- 見出しは20字程度にしてください\n\n"
        f"記事内容：\n{article_data["article"]}\n\n"
        "見出し："
    )

    # LLMへのリクエストを送信
    response = requests.post(API_URL, json={
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": TEMPERATURE
    })
    # 応答を整形して返す
    return clean_response(response.json()["choices"][0]["message"]["content"])

@app.route("/", methods=["GET"])
def home():
    """ ルートエンドポイント """
    return jsonify({"message": "Welcome to the Headline Checker API. Use the /headline endpoint to analyze articles."})

@app.route("/headline", methods=["POST"])
def headline_api():
    """ APIエンドポイント：記事URLを受け取り、要約を生成して返す """
    data = request.json
    article_url = data.get("url", "")
    if not article_url:
        return jsonify({"headline": "記事URLが指定されていません"}), 400

    article_data = fetch_article_text(article_url)
    judge = is_headline_relevant_llm(article_data)
    if not judge:
        if article_data["headline"] == None or article_data["article"].startswith("記事の取得に失敗しました"):
            return jsonify(article_data), 500

    headline = generate_headline(article_data)
    return jsonify({"headline": headline, "original_headline": article_data["headline"], "judge": judge})

if __name__ == "__main__":
    app.run(port=8000, debug=True)