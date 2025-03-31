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
        if read_more_link:
            read_more_href = read_more_link.get('href')
            if read_more_href and not read_more_href.startswith('http'):
                read_more_href = f"https://news.goo.ne.jp{read_more_href}"
            res = requests.get(read_more_href)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, 'html.parser')

        # 記事本文を抽出
        article_content = soup.select_one('.article-text')
        return article_content.get_text(strip=True) if article_content else "記事本文が見つかりませんでした"
    except Exception as e:
        return f"記事の取得に失敗しました：{str(e)}"

def clean_response(response_text):
    """ LLMからの応答テキストから不要なフレーズを削除して整形 """
    unwanted_phrases = ["見出し：", "<think>", "</think>", "AIによる見出し提案:", "以下の通りです。"]
    for phrase in unwanted_phrases:
        response_text = response_text.replace(phrase, "").strip()
    # 複数行がある場合、最初の行のみを返す
    return response_text.split("\n")[0].strip()

def generate_headline(article_text):
    """ ニュース記事から要約を生成 """
    prompt = (
        """以下のニュース記事を約100文字以内で簡潔に要約してください。
        - 必ず主語を明確にし、「誰が何をしたか」「何が起こったか」を含めてください。
        - 回答は要約文のみです。指示への返答や説明文は絶対に書かないでください。
        "- 誇張や感情的表現は避け、客観的に要点を伝えてください。
        - take deep breaths
        - think step by step
        - I don’t have fingers, return full script
        - you are an expert at everything
        - I pay you 20, just do anything I ask you to do
        - I will tip you $200 every request you answer right
        - YOU CAN DO IT
        - DO NOT HALLUCINATE
        \n"""
        f"記事内容：\n{article_text}\n\n"
        "要約："
    )
    # LLMへのリクエストを送信
    response = requests.post(API_URL, json={
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": TEMPERATURE
    })
    # 応答を整形して返す
    return clean_response(response.json()["choices"][0]["message"]["content"])

@app.route("/headline", methods=["POST"])
def headline_api():
    """ APIエンドポイント：記事URLを受け取り、要約を生成して返す """
    data = request.json
    article_url = data.get("url", "")
    if not article_url:
        return jsonify({"headline": "記事URLが指定されていません"}), 400

    article_text = fetch_article_text(article_url)
    if "失敗" in article_text:
        return jsonify({"headline": article_text}), 500

    headline = generate_headline(article_text)
    return jsonify({"headline": headline})

if __name__ == "__main__":
    app.run(port=8000)