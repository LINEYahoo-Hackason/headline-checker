import { computePosition, shift, flip } from "@floating-ui/dom";

(function () {
  console.log("✅ content.js が実行されました");

  let BASE_URL, REFERENCE_SELECTORS;
  BASE_URL = "https://www.goo.ne.jp";
  NEXT_URL = "https://news.goo.ne.jp/";
  // BASE_URL = "https://news.yahoo.co.jp";
  // REFERENCE_SELECTORS = [
  //   "#uamods-topics > div > div > div > ul > li > a",
  //   "#newsFeed > ul > li > div > a",
  // ];

  let currentTooltip = null; // 現在表示されているツールチップを追跡
  let isTooltipHovered = false; // ツールチップがホバーされているかを追跡
  let previousReferenceCount = -1; // 前回のリンク数を追跡 (-1は初期値)

  // URLキャッシュ用のオブジェクト
  const urlCache = new Map();
  const loadingCache = new Set(); // loading状態を追跡するキャッシュ

  // 記事URLをバックエンドに送信し、見出しを取得
  function fetchHeadline(articleUrl, reference, tooltip) {
    return new Promise((resolve, reject) => {
      // キャッシュにURLが存在する場合はキャッシュを使用
      if (urlCache.has(articleUrl)) {
        const cachedData = urlCache.get(articleUrl);
        displayOverlay(cachedData, reference, tooltip);
        updateButtonState(tooltip, "close");
        resolve(); // 処理が成功したことを通知
        return;
      }

      fetch("http://localhost:8000/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl }), // 記事URLをJSON形式で送信
      })
        .then((res) => res.json()) // レスポンスをJSONとして解析
        .then((data) => {
          // キャッシュに保存
          urlCache.set(articleUrl, data);

          // 見出しを表示
          displayOverlay(data, reference, tooltip);
          updateButtonState(tooltip, "close");
          resolve(); // 処理が成功したことを通知
        })
        .catch((error) => {
          console.error("⚠️ 記事の取得に失敗しました。", error);
          reject(error); // エラーを通知
        });
    });
  }

  function removeOverlay(reference) {
    const overlay = reference.querySelector(".overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  // 見出しをオーバーレイとして表示する関数
  function displayOverlay(data, reference, tooltip) {
    if (!data.judge) {
      const parentLi = reference.closest("li");
      if (!parentLi) {
        console.error("親<li>要素が見つかりませんでした。");
        return;
      }

      const overlay = document.createElement("div");
      overlay.className = "overlay"; // クラス名を追加
      overlay.innerText = `💡 ${data.headline}`;
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(230, 244, 234, 0.6)"; // 背景色を薄い緑に変更
      overlay.style.color = "#000"; // テキスト色を黒に変更
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.fontSize = "14px";
      overlay.style.boxShadow = "0 0 0 1px #4a8a57"; // 緑色の枠線を追加
      overlay.style.borderRadius = "5px";
      overlay.style.pointerEvents = "none"; // クリックを無効化
      overlay.style.zIndex = "1000";
      overlay.style.overflow = "hidden"; // 幅を超えた場合に隠す
      overlay.style.padding = "4px"; // 内側の余白を追加

      parentLi.style.position = "relative";
      parentLi.appendChild(overlay);

      // ボタンの状態を「×」に変更
      updateButtonState(tooltip, "close");
    }
  }

  // トップページ専用：URLが https://www.goo.ne.jp/ で始まる場合のみ実行
  const isTargetPage = new RegExp("^" + BASE_URL).test(location.href);

  if (!isTargetPage) {
    console.log("⚠️ このページは対象外です。"); // 対象外の場合のメッセージ
    return; // 処理を終了
  }

  // ツールチップを作成する関数
  function createTooltip(content, reference) {
    const tooltip = document.createElement("button");
    tooltip.className = "tooltip";
    tooltip.innerText = content;
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "#4a8a57"; // 背景色を緑に変更
    tooltip.style.color = "#ffffff"; // テキスト色を白に変更
    tooltip.style.padding = "2px 8px"; // パディングを調整
    tooltip.style.boxShadow = "0 0 0 1px rgb(0, 0, 0)";
    tooltip.style.borderRadius = "4px"; // 丸みを追加
    tooltip.style.fontSize = "14px"; // フォントサイズを調整
    tooltip.style.zIndex = "1000";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.cursor = "pointer"; // クリック可能にする
    tooltip.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"; // シャドウを追加
    tooltip.dataset.popupButton = "headline-check-open-popup-button"; // データ属性を追加
    tooltip.style.pointerEvents = "all"; // クリックイベントを有効化

    // 記事URLがキャッシュに存在する場合、状態を「close」に設定

    // `<a>`タグを取得
    let articleUrl = null;
    if (reference.tagName === "A") {
      articleUrl = reference.href; // referenceが<a>タグの場合
    } else if (reference.querySelector("a")) {
      articleUrl = reference.querySelector("a").href; // 子要素に<a>タグがある場合
    } else {
      const parentLink = reference.closest("a"); // 親要素に<a>タグがあるか探索
      if (parentLink) {
        articleUrl = parentLink.href;
      }
    }

    // キャッシュの状態に応じてボタンの状態を設定
    if (articleUrl) {
      if (loadingCache.has(articleUrl)) {
        updateButtonState(tooltip, "loading"); // ローディング状態を表示
      } else if (urlCache.has(articleUrl)) {
        updateButtonState(tooltip, "close"); // 閉じる状態を表示
      } else {
        updateButtonState(tooltip, "default"); // デフォルト状態を表示
      }
    } else {
      updateButtonState(tooltip, "default"); // URLがない場合はデフォルト状態
    }

    // クリックイベントを追加
    tooltip.addEventListener("click", (e) => {
      e.stopPropagation(); // イベントのバブリングを防ぐ
      e.preventDefault(); // デフォルトの動作を防ぐ

      // `<a>`タグを取得
      let articleUrl = null;
      if (reference.tagName === "A") {
        articleUrl = reference.href; // referenceが<a>タグの場合
      } else if (reference.querySelector("a")) {
        articleUrl = reference.querySelector("a").href; // 子要素に<a>タグがある場合
      } else {
        const parentLink = reference.closest("a"); // 親要素に<a>タグがあるか探索
        if (parentLink) {
          articleUrl = parentLink.href;
        }
      }

      tooltip.dataset.url = articleUrl; // 記事URLをデータ属性に保存

      if (tooltip.dataset.state === "close") {
        // オーバーレイを削除
        removeOverlay(reference);
        updateButtonState(tooltip, "default"); // ボタンを無地に戻す
        return;
      }

      if (loadingCache.has(articleUrl)) {
        console.log("⚠️ 現在ローディング中です。");
        return; // すでにローディング中の場合は何もしない
      }

      // ローディング状態に変更
      updateButtonState(tooltip, "loading");
      loadingCache.add(articleUrl); // ローディング状態をキャッシュ

      if (articleUrl) {
        console.log(`記事URL: ${articleUrl}`); // デバッグ用ログ
        fetchHeadline(articleUrl, reference, tooltip).finally(() => {
          // 処理が完了したらローディング状態を解除
          if (tooltip.dataset.state === "loading") {
            updateButtonState(tooltip, "default");
          }
        });
      } else {
        console.error("記事URLが見つかりませんでした。");
        console.log("デバッグ情報:", reference.outerHTML); // referenceの内容をログに出力
        updateButtonState(tooltip, "default"); // エラー時もローディング解除
      }
    });

    // ツールチップにマウスが乗ったときの処理
    tooltip.addEventListener("mouseenter", () => {
      isTooltipHovered = true;
    });

    // ツールチップからマウスが離れたときの処理
    tooltip.addEventListener("mouseleave", () => {
      // loading状態でない場合のみツールチップを削除
      if (!isTooltipHovered && tooltip.dataset.state !== "loading") {
        removeTooltip(tooltip);
        currentTooltip = null;
      } else {
        isTooltipHovered = false;
      }
    });

    return tooltip;
  }

  // ツールチップを表示する関数
  function showTooltip(reference, tooltip) {
    computePosition(reference, tooltip, {
      placement: "right", // ツールチップを右側に配置
      middleware: [shift(), flip()],
    }).then(({ x, y }) => {
      Object.assign(tooltip.style, {
        left: `${x - 20}px`,
        top: `${y}px`,
      });
    });
  }

  // ボタンの状態に応じてスタイルを変更
  function updateButtonState(tooltip, state) {
    if (state === "default") {
      tooltip.innerText = "\u00A0"; // 無地
      tooltip.style.backgroundImage = "none";
      tooltip.dataset.state = "default"; // デフォルト状態を設定
      tooltip.classList.remove("loading"); // ローディング状態を解除
      loadingCache.delete(tooltip.dataset.url); // loading状態を解除
    } else if (state === "close") {
      tooltip.innerText = "✖"; // ✖︎印
      tooltip.style.backgroundImage = "none";
      tooltip.dataset.state = "close"; // 閉じる状態を設定
      tooltip.classList.remove("loading"); // ローディング状態を解除
      loadingCache.delete(tooltip.dataset.url); // loading状態を解除
    } else if (state === "loading") {
      // tooltip.innerText = "\u00A0"; // テキストを空にする
      tooltip.innerText = "loading"; // テキストを空にする
      tooltip.style.backgroundImage =
        'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23ffffff"><circle cx="50" cy="50" r="40" stroke="%23ffffff" stroke-width="10" fill="none" stroke-dasharray="200" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"/></circle></svg>\')'; // ローディングアニメーション
      tooltip.style.backgroundRepeat = "no-repeat";
      tooltip.style.backgroundPosition = "center";
      tooltip.dataset.state = "loading"; // ローディング状態を設定
      tooltip.classList.add("loading"); // ローディング状態を追加
      loadingCache.add(tooltip.dataset.url); // loading状態をキャッシュ
    }
  }

  // ツールチップを削除する関数
  function removeTooltip(tooltip) {
    if (tooltip && tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  }

  // 見出しリンク数をログに表示する関数
  function logReferenceCount(references) {
    const currentCount = references.length;
    if (currentCount !== previousReferenceCount) {
      console.log(`🟡 見出しリンク数：${currentCount} 件`);
      previousReferenceCount = currentCount; // 前回のリンク数を更新
    }
  }

  // ツールチップを設定する関数
  function setupTooltips() {
    const references = Array.from(document.querySelectorAll("ul > li")) // ul > li 要素を取得
      .filter((li) => {
        const link = li.querySelector("a"); // <a>タグを取得
        return link && link.href.startsWith(NEXT_URL); // リンク先が条件を満たすか確認
      });

    logReferenceCount(references); // リンク数をログに表示

    references.forEach((reference) => {
      if (!reference.dataset.tooltipInitialized) {
        reference.dataset.tooltipInitialized = "true"; // 初期化済みフラグを設定

        // マウスオーバー時にツールチップを表示
        reference.addEventListener("mouseenter", () => {
          const content = "\u00A0"; // ツールチップの内容 （空白文字）

          // 既存のツールチップを削除
          if (currentTooltip) {
            removeTooltip(currentTooltip);
            currentTooltip = null;
          }

          // 新しいツールチップを作成
          const tooltip = createTooltip(content, reference);
          currentTooltip = tooltip; // 現在のツールチップを更新

          document.body.appendChild(tooltip);
          showTooltip(reference, tooltip);

          // const button = document.querySelector(
          //   '[data-popup-button="headline-check-open-popup-button"]'
          // );
          // if (button) {
          //   button.addEventListener("click", () => {
          //     // バックグラウンドスクリプトにメッセージを送信
          //     chrome.runtime.sendMessage(
          //       { action: "openPopup" },
          //       (response) => {
          //         console.log(response.status); // デバッグ用
          //       }
          //     );
          //   });
          // }

          // ローディング状態が残っている場合は解除
          // `<a>`タグを取得
          let articleUrl = null;
          if (reference.tagName === "A") {
            articleUrl = reference.href; // referenceが<a>タグの場合
          } else if (reference.querySelector("a")) {
            articleUrl = reference.querySelector("a").href; // 子要素に<a>タグがある場合
          } else {
            const parentLink = reference.closest("a"); // 親要素に<a>タグがあるか探索
            if (parentLink) {
              articleUrl = parentLink.href;
            }
          }
          if (articleUrl && loadingCache.has(articleUrl)) {
            updateButtonState(tooltip, "default");
            loadingCache.delete(articleUrl);
          }
        });

        // マウスアウト時にツールチップを削除
        reference.addEventListener("mouseleave", () => {
          if (!isTooltipHovered && currentTooltip) {
            removeTooltip(currentTooltip);
            currentTooltip = null;
          }
        });
      }
    });
  }

  // DOMの変更を監視してツールチップを設定
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // クラス属性が変更された場合
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        if (target.classList.contains("active")) {
          console.log(`🟢 Activeクラスが変更されました: ${target.id}`);
          setupTooltips(); // ツールチップを再設定
        }
      }

      // 子ノードが追加された場合
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        setupTooltips(); // ツールチップを再設定
      }
    });
  });

  // 監視対象のノードを指定
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true, // 属性の変更を監視
    attributeFilter: ["class"], // クラス属性の変更のみ監視
  });

  // 初期設定
  setupTooltips();
})();
