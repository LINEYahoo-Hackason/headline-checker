
(function () {
    console.log("✅ content.js が実行されました");


    // ボタン要素を作成する関数
    function createButton(element) {
        const button = document.createElement("button");
        button.innerText = "AI見出し"; // ボタンのテキスト
        button.className = "ai-button"; // ボタンのクラス名
        button.style.position = "absolute"; // ボタンの位置を絶対配置
        
		button.style.top = "-0.6px";
   		button.style.right = "0px";
    	button.style.fontSize = "12px";
    	button.style.lineHeight = "12px";
    	button.style.fontFamily = '"BIZ UDゴシック", sans-serif';
    	button.style.padding = "4px 20px";
    	button.style.zIndex = "1000";
    	button.style.cursor = "pointer";

    // ✅ 通常時の見た目（白背景・黒文字・枠線#4a8a57）
    	button.style.backgroundColor = "#ffffff";
    	button.style.color = "#000000";
    	button.style.border = "2px solid #4a8a57";
    	button.style.borderRadius = "4px";

    	return button;
	}

    // 記事URLをバックエンドに送信し、見出しを取得
    function fetchHeadline(articleUrl) {
        fetch("http://localhost:8000/headline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl }) // 記事URLをJSON形式で送信
        })
        .then(res => res.json()) // レスポンスをJSONとして解析
        .then(data => {
            if (data.judge) {
                data.headline = "見出しは適切である"; // 見出しが適切である場合
            } else {
                alert(`💡 AIによる新しい見出し提案:\n${data.headline}`); // 新しい見出しを提案
            }})

            // alert(`💡 AIによる見出し提案:\n${data.headline}`)  // 取得した見出しをアラート表示
        .catch(err => alert("⚠️ 記事の取得に失敗しました。")); // エラーハンドリング
    }

    // ホバーした見出しにボタンを表示
    function addButton(element) {
        const button = createButton(element); // ボタンを作成
        button.addEventListener("click", (e) => {
            e.stopPropagation(); // イベントのバブリングを防ぐ
            e.preventDefault(); // デフォルトの動作を防ぐ
            const articleUrl = element.tagName === 'A' ? element.href : element.closest('a')?.href; // 記事URLを取得
            if (articleUrl) fetchHeadline(articleUrl); // URLが存在する場合、見出しを取得
        });
        element.appendChild(button); // ボタンを要素に追加
    }

    // トップページ専用：URLが https://www.goo.ne.jp/ で始まる場合のみ実行
    if (!/^https:\/\/www\.goo\.ne\.jp\//.test(location.href)) {
        console.log("⚠️ このページは対象外です。"); // 対象外の場合のメッセージ
        return; // 処理を終了
    }

    // DOMの完全描画を待つために3秒遅延させる
    setTimeout(() => {
        const headlines = document.querySelectorAll("a[id^='pcnews-topstories'], span.module-ranking-word, span.module-caption-text"); // 見出し要素を取得
        console.log(`🟡 見出しリンク数：${headlines.length} 件`); // 見出しの数をログに表示

        headlines.forEach((element) => {
            element.style.position = "relative"; // 要素の位置を相対配置
            element.addEventListener("mouseenter", () => addButton(element)); // マウスオーバー時にボタンを追加
            element.addEventListener("mouseleave", () => {
                const button = element.querySelector(".ai-button"); // ボタンを取得
                if (button) button.remove(); // ボタンが存在する場合、削除
            });
        });
    }, 3000); // 3秒後に実行
})();
