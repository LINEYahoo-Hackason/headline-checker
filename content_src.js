import { computePosition, shift } from "@floating-ui/dom";

(function () {
  console.log("✅ content.js が実行されました");

  let currentTooltip = null; // 現在表示されているツールチップを追跡
  let isTooltipHovered = false; // ツールチップがホバーされているかを追跡

  // 記事URLをバックエンドに送信し、見出しを取得
  function fetchHeadline(articleUrl) {
    fetch("http://localhost:8000/headline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: articleUrl }), // 記事URLをJSON形式で送信
    })
      .then((res) => res.json()) // レスポンスをJSONとして解析
      .then((data) => {
        if (data.judge) {
          alert("✅ 見出しは適切です。");
        } else {
          alert(`💡 AIによる新しい見出し提案:\n${data.headline}`);
        }
      })
      .catch(() => alert("⚠️ 記事の取得に失敗しました。"));
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
    tooltip.style.backgroundColor = "#ffffff";
    tooltip.style.color = "#000000";
    tooltip.style.padding = "4px 20px";
    tooltip.style.border = "2px solid #4a8a57";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.zIndex = "1000";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.cursor = "pointer"; // クリック可能にする

    // クリックイベントを追加
    tooltip.addEventListener("click", (e) => {
      e.stopPropagation(); // イベントのバブリングを防ぐ
      e.preventDefault(); // デフォルトの動作を防ぐ

      // `<li>` 内の `<a>` タグを取得して URL を取得
      const articleUrl = reference.querySelector("a")?.href;

      if (articleUrl) {
        console.log(`記事URL: ${articleUrl}`); // デバッグ用ログ
        fetchHeadline(articleUrl); // URLが存在する場合、見出しを取得
      } else {
        console.error("記事URLが見つかりませんでした。");
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
      middleware: [shift()], // ビューポート内に収める
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

  // DOMの変更を監視してツールチップを設定
  const observer = new MutationObserver(() => {
    const references = document.querySelectorAll("[data-topicsid]"); // data-topicsid 属性を持つ要素を取得

    references.forEach((reference) => {
      if (!reference.dataset.tooltipInitialized) {
        reference.dataset.tooltipInitialized = "true"; // 初期化済みフラグを設定

        // マウスオーバー時にツールチップを表示
        reference.addEventListener("mouseenter", () => {
          const content = "AI見出し"; // ツールチップの内容

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
  });

  // 監視対象のノードを指定
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
