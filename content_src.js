import { computePosition, shift , flip } from "@floating-ui/dom";

(function () {
  console.log("✅ content.js が実行されました");

  let currentTooltip = null; // 現在表示されているツールチップを追跡
  let isTooltipHovered = false; // ツールチップがホバーされているかを追跡
  let previousReferenceCount = -1; // 前回のリンク数を追跡 (-1は初期値)

  // 記事URLをバックエンドに送信し、見出しを取得
  function fetchHeadline(articleUrl, reference) {
    fetch("http://localhost:8000/headline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: articleUrl }), // 記事URLをJSON形式で送信
    })
      .then((res) => res.json()) // レスポンスをJSONとして解析
      .then((data) => {
        if (data.judge) {
          console.log("✅ 見出しは適切です。");
        } else {
          // 親<li>要素を取得
          const parentLi = reference.closest("li");
          if (!parentLi) {
            console.error("親<li>要素が見つかりませんでした。");
            return;
          }

          // 提案された見出しをオーバーレイ表示
          const overlay = document.createElement("div");
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
          overlay.style.boxShadow = "0 0 0 1px #4a8a57"; // 緑色のシャドウを追加 緑色の枠線を追加
          overlay.style.borderRadius = "5px";
          overlay.style.pointerEvents = "none"; // クリックを無効化
          overlay.style.zIndex = "1000";
          overlay.style.overflow = "hidden"; // 幅を超えた場合に隠す
          overlay.style.padding = "4px"; // 内側の余白を追加
          overlay.style.boxShadow = "0px 2px 4px rgba(0, 0, 0, 0.1)"; // シャドウを追加

          // 親<li>要素にオーバーレイを追加
          parentLi.style.position = "relative"; // 親要素を相対位置に設定
          parentLi.appendChild(overlay);

          // // 数秒後にオーバーレイを削除
          // setTimeout(() => {
          //   if (overlay.parentNode) {
          //     overlay.parentNode.removeChild(overlay);
          //   }
          // }, 3000); // 3秒後に削除
        }
      })
      .catch(() => console.error("⚠️ 記事の取得に失敗しました。"));
  }

  // トップページ専用：URLが https://www.goo.ne.jp/ で始まる場合のみ実行
  if (!/^https:\/\/www\.goo\.ne\.jp\//.test(location.href)) {
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
    tooltip.style.padding = "6px 12px"; // パディングを調整
    tooltip.style.boxShadow = "0 0 0 1px rgb(0, 0, 0)";
    tooltip.style.borderRadius = "4px"; // 丸みを追加
    tooltip.style.fontSize = "14px"; // フォントサイズを調整
    tooltip.style.zIndex = "1000";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.cursor = "pointer"; // クリック可能にする
    tooltip.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"; // シャドウを追加

    // クリックイベントを追加
    tooltip.addEventListener("click", (e) => {
      e.stopPropagation(); // イベントのバブリングを防ぐ
      e.preventDefault(); // デフォルトの動作を防ぐ

      // `<a>`タグを取得
      let articleUrl = null;
      if (reference.tagName === "A") {
        articleUrl = reference.href; // referenceが<a>タグの場合
      } else {
        const parentLink = reference.closest("a"); // 親要素に<a>タグがあるか探索
        if (parentLink) {
          articleUrl = parentLink.href;
        }
      }

      if (articleUrl) {
        console.log(`記事URL: ${articleUrl}`); // デバッグ用ログ
        fetchHeadline(articleUrl, reference); // URLが存在する場合、見出しを取得
      } else {
        console.error("記事URLが見つかりませんでした。");
        console.log("デバッグ情報:", reference.outerHTML); // referenceの内容をログに出力
      }
    });

    // ツールチップにマウスが乗ったときの処理
    tooltip.addEventListener("mouseenter", () => {
      isTooltipHovered = true;
    });

    // ツールチップからマウスが離れたときの処理
    tooltip.addEventListener("mouseleave", () => {
      isTooltipHovered = false;
      if (!isTooltipHovered) {
        removeTooltip(tooltip);
        currentTooltip = null;
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
        left: `${x}px`,
        top: `${y}px`,
      });
    });
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
    const references = document.querySelectorAll(
      "a[id*='pcnews'], span.module-ranking-word, span.module-caption-text"
    ); // 見出し要素を取得

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
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
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
