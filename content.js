(function () {
    console.log("✅ content.js が実行されました");

    // ボタンのデフォルトスタイル
    function setButtonDefaultSize(button, element) {
        button.style.fontSize = "12px";
        button.style.padding = "4px";
        button.style.minWidth = "40px";
        button.style.minHeight = `${element.clientHeight}px`;  // 見出しの高さに合わせる
        button.style.position = "relative";  // 相対位置にして基準を固定
        button.style.left = "0";  // 元の位置を維持
    }

    // ボタンのローディングスタイル
    function setButtonLoadingSize(button, element) {
        button.style.fontSize = "16px";
        button.style.padding = "8px";
        button.style.minWidth = `${element.clientWidth + 60}px`;  // 元の位置から魚が動く範囲分だけ左に伸ばす
        button.style.minHeight = `${element.clientHeight}px`;  // 見出しの高さに合わせる
        button.style.position = "relative";  // 相対位置にして基準を維持
        button.style.left = "-30px";  // 左方向に伸ばす
    }

    // ボタン要素を作成する関数
    function createButton(element) {
        const button = document.createElement("button");
        setButtonDefaultSize(button, element);
        button.dataset.loading = false;
        button.className = "ai-button";
        button.style.position = "relative";  // 相対位置にして基準を固定
        button.style.top = "0px";
        button.style.zIndex = "1000";        // 前面に表示
        button.style.cursor = "pointer";
        button.style.backgroundColor = "#2e8b57"; // 背景色を緑に設定して見えやすく
        button.style.color = "#fff";
        button.style.border = "2px solid #2e8b57"; // ボーダーを緑に設定
        button.style.borderRadius = "4px";
        button.textContent = "";  // 初期表示のテキストを設定

        // 親要素のoverflowを強制的にvisibleに設定
        const parentStyle = window.getComputedStyle(element);
        if (parentStyle.overflow === "hidden" || parentStyle.overflow === "auto") {
            element.style.overflow = "visible";
        }

        return button;
    }

    // spanタグを使って動く魚アイコンを作成
    function createMovingFish() {
        const span = document.createElement("span");
        span.style.display = "flex";
        span.style.width = "60px";            // 魚の動く範囲
        span.style.height = "100%";           // 見出しに合わせる
        span.style.backgroundImage = "url('http://localhost:8000/static/fish.png')";
        span.style.backgroundSize = "contain";   // 枠内に収まるように表示
        span.style.backgroundRepeat = "no-repeat";
        span.style.backgroundPosition = "center"; // 中央配置
        span.style.position = "absolute";     // 絶対位置指定で上部に固定
        span.style.top = "0";                 // 上部に配置
        span.style.left = "0";                // ボタン左端に合わせる
        span.style.transform = "translateX(-50%)";  // 中央揃え
        span.style.margin = "0 auto";             // 横方向中央揃え
        span.style.zIndex = "10";                 // ボタンの上に表示されるように設定
        span.style.pointerEvents = "none";        // 魚アイコン自体はクリックできないように設定
        span.style.border = "none";               // 枠線を無くす
        span.style.borderRadius = "4px";          // 角を丸める
        console.log("魚アイコン生成:", span);  // デバッグ

        // アニメーション用のクラスを追加
        span.classList.add("moving-fish");

        return span;
    }

    // CSSアニメーションを動的に追加
    const style = document.createElement("style");
    style.innerHTML = `
@keyframes moveLeftRight {
    0% { transform: translateX(0); }
    50% { transform: translateX(30px); }
    100% { transform: translateX(0); }
}
.moving-fish {
    animation: moveLeftRight 1s infinite ease-in-out;
}
`;
    document.head.appendChild(style);

    // 記事URLをバックエンドに送信し、見出しを取得
    function fetchHeadline(articleUrl, button, element) {
        console.log("fetchHeadline関数が呼ばれました:", articleUrl); // 追加

        setButtonLoadingSize(button, element);  // ローディング開始時にボタンサイズを大きく
        
        let fish;  // 魚アイコンをスコープの先頭で宣言

        setTimeout(() => {
            fish = createMovingFish();
            console.log("魚アイコンが生成されました:", fish); // 追加
            button.appendChild(fish);  // ボタンサイズを設定してから魚アイコンを表示
        }, 50);

        fetch("http://localhost:8000/headline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl }) // 記事URLをJSON形式で送信
        })
        .then(res => res.json()) // レスポンスをJSONとして解析
        .then(data => {
            setButtonDefaultSize(button, element);  // ローディング終了時にボタンサイズを戻す
            // 見出し表示後にボタンを見出し全体に広げる
            button.style.width = "100%";  
            button.style.height = `${element.clientHeight}px`;
            button.style.position = "absolute";
            button.style.top = "0";
            button.style.left = "0";
            button.style.zIndex = "2000";  // 前面に表示
            button.innerText = `${data.headline}`; // 取得した見出しをボタンに表示
            if (fish && fish.parentNode) {
                button.removeChild(fish);  // 魚アイコンをボタンから削除
            }
        })
        .catch(err => {
            setButtonDefaultSize(button, element);  // エラー時もボタンサイズを戻す
            button.innerText = "⚠️ 記事の取得に失敗しました"; // エラーハンドリング
            if (fish && fish.parentNode) {
                button.removeChild(fish);  // エラー時にも魚アイコンを削除
            }
        });
    }

    function addButton(element) {
        const button = createButton(element); // ボタンを作成
        console.log("ボタンが生成されました:", button); // デバッグ

        button.addEventListener("click", (e) => {
            console.log("ボタンがクリックされました");  // デバッグ
            e.stopPropagation(); // イベントのバブリングを防ぐ
            e.preventDefault(); // デフォルトの動作を防ぐ
            const articleUrl = element.tagName === 'A' ? element.href : element.closest('a')?.href;
            console.log("取得した記事URL:", articleUrl); // デバッグ
            if (articleUrl) fetchHeadline(articleUrl, button, element); // URLが存在する場合、見出しを取得
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