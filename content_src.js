import { computePosition, shift, flip } from "@floating-ui/dom";

(function () {
  console.log("✅ content.js が実行されました");
  // 定数定義
  let BASE_URL, REFERENCE_SELECTORS;
  BASE_URL = "https://www.goo.ne.jp";
  NEXT_URL = "https://news.goo.ne.jp/";
  const TOOLTIP_STATES = {
    DEFAULT: "default",
    CLOSE: "close",
    LOADING: "loading",
  };

  // グローバル変数
  let currentTooltip = null;
  let isTooltipHovered = false;
  let previousReferenceCount = -1;
  const urlCache = new Map();
  const loadingCache = new Set();

  // ツールチップの状態を更新
  function updateButtonState(tooltip, state) {
    const stateConfig = {
      [TOOLTIP_STATES.DEFAULT]: {
        text: "\u00A0",
        backgroundImage: "none",
        classAction: "remove",
      },
      [TOOLTIP_STATES.CLOSE]: {
        text: "✖",
        backgroundImage: "none",
        classAction: "remove",
      },
      [TOOLTIP_STATES.LOADING]: {
        text: "\u00A0",
        backgroundImage:
          'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23ffffff"><circle cx="50" cy="50" r="40" stroke="%23ffffff" stroke-width="10" fill="none" stroke-dasharray="200" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"/></circle></svg>\')',
        classAction: "add",
        additionalStyles: {
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "contain",
        },
      },
    };

    const config = stateConfig[state];
    if (!config) return;

    tooltip.innerText = config.text;
    tooltip.style.backgroundImage = config.backgroundImage;
    tooltip.dataset.state = state;
    tooltip.classList[config.classAction]("loading");

    // 追加のスタイルを適用
    if (config.additionalStyles) {
      Object.assign(tooltip.style, config.additionalStyles);
    }

    const articleUrl = tooltip.dataset.url;
    if (articleUrl) {
      // キャッシュに状態を保存
      const cachedData = urlCache.get(articleUrl) || {};
      urlCache.set(articleUrl, { ...cachedData, state });
    }

    if (state === TOOLTIP_STATES.LOADING) {
      loadingCache.add(tooltip.dataset.url);
    } else {
      loadingCache.delete(tooltip.dataset.url);
    }
  }

  // ツールチップを作成
  function createTooltip(content, reference) {
    const tooltip = document.createElement("button");
    Object.assign(tooltip.style, {
      position: "absolute",
      backgroundColor: "rgba(74, 138, 87, 0.9)",
      color: "rgba(255, 255, 255, 0.8)",
      padding: "0", // 内側の余白を削除
      border: "2px solid rgba(102, 102, 102, 0.9)", // 枠線の色と太さ
      borderRadius: "4px",
      fontSize: "14px",
      lineHeight: "1", // 行の高さを設定
      height: `min(20px, ${reference.offsetHeight}px, ${reference.offsetWidth}px)`, // 見出しと同じ高さ
      width: `min(20px, ${reference.offsetHeight}px, ${reference.offsetWidth}px)`, // 見出しと同じ幅
      zIndex: "1000",
      whiteSpace: "nowrap",
      cursor: "pointer",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    });
    tooltip.className = "tooltip";
    tooltip.innerText = content;
    tooltip.dataset.popupButton = "headline-check-open-popup-button";

    const articleUrl = getArticleUrl(reference);
    tooltip.dataset.url = articleUrl;

    if (articleUrl) {
      const cachedData = urlCache.get(articleUrl);
      if (loadingCache.has(articleUrl)) {
        updateButtonState(tooltip, TOOLTIP_STATES.LOADING);
      } else if (cachedData && cachedData.state === TOOLTIP_STATES.CLOSE) {
        updateButtonState(tooltip, TOOLTIP_STATES.CLOSE);
      } else {
        updateButtonState(tooltip, TOOLTIP_STATES.DEFAULT);
      }
    } else {
      updateButtonState(tooltip, TOOLTIP_STATES.DEFAULT);
    }

    tooltip.addEventListener("click", (e) =>
      handleTooltipClick(e, tooltip, reference)
    );
    tooltip.addEventListener("mouseenter", () => (isTooltipHovered = true));
    tooltip.addEventListener("mouseleave", () =>
      handleTooltipMouseLeave(tooltip)
    );

    return tooltip;
  }

  // 記事URLを取得
  function getArticleUrl(reference) {
    if (reference.tagName === "A") return reference.href;
    const childLink = reference.querySelector("a");
    if (childLink) return childLink.href;
    const parentLink = reference.closest("a");
    return parentLink ? parentLink.href : null;
  }

  // ツールチップクリック時の処理
  function handleTooltipClick(event, tooltip, reference) {
    event.stopPropagation();
    event.preventDefault();

    const articleUrl = tooltip.dataset.url;
    if (!articleUrl) {
      console.error("記事URLが見つかりませんでした。");
      return;
    }

    if (tooltip.dataset.state === TOOLTIP_STATES.CLOSE) {
      removeOverlay(reference);
      updateButtonState(tooltip, TOOLTIP_STATES.DEFAULT);
      return;
    }

    if (loadingCache.has(articleUrl)) {
      console.log("⚠️ 現在ローディング中です。");
      return;
    }

    updateButtonState(tooltip, TOOLTIP_STATES.LOADING);
    fetchHeadline(articleUrl, reference, articleText, tooltip).finally(() => {
      if (tooltip.dataset.state === TOOLTIP_STATES.LOADING) {
        updateButtonState(tooltip, TOOLTIP_STATES.DEFAULT);
      }
    });
  }

  // ツールチップからマウスが離れたときの処理
  function handleTooltipMouseLeave(tooltip) {
    if (!isTooltipHovered && tooltip.dataset.state !== TOOLTIP_STATES.LOADING) {
      removeTooltip(tooltip);
      currentTooltip = null;
    } else {
      isTooltipHovered = false;
    }
  }

  // ツールチップを表示
  function showTooltip(reference, tooltip) {
    computePosition(reference, tooltip, {
      placement: "right",
      middleware: [shift(), flip()],
    }).then(({ x, y }) => {
      Object.assign(tooltip.style, {
        left: `${x - 20}px`,
        top: `${y}px`,
      });
    });
  }

  // 記事URLをバックエンドに送信し、見出しを取得
  function fetchHeadline(articleUrl, reference, articleText, tooltip) {
    return new Promise((resolve, reject) => {
      // キャッシュにURLが存在する場合はキャッシュを使用
      if (urlCache.has(articleUrl)) {
        const cachedData = urlCache.get(articleUrl);
        if (cachedData && cachedData.data) {
          displayOverlay(cachedData.data, reference, tooltip);
          updateButtonState(tooltip, TOOLTIP_STATES.CLOSE);
          resolve(); // 処理が成功したことを通知
          return;
        }
      }

      fetch("http://localhost:8000/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: articleUrl,
          original_headline: articleText,
        }), // 記事URLをJSON形式で送信
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTPエラー: ${res.status}`);
          }
          return res.json();
        }) // レスポンスをJSONとして解析
        .then((data) => {
          if (!data || typeof data !== "object" || !data.headline) {
            throw new Error("不正なデータ形式が返されました");
          }

          // キャッシュに保存
          urlCache.set(articleUrl, { data, state: TOOLTIP_STATES.CLOSE });
          // 見出しを表示
          displayOverlay(data, reference, tooltip);
          updateButtonState(tooltip, TOOLTIP_STATES.CLOSE);
          resolve(); // 処理が成功したことを通知
        })
        .catch((error) => {
          console.error("⚠️ 記事の取得に失敗しました。", error);
          updateButtonState(tooltip, TOOLTIP_STATES.DEFAULT); // 状態をデフォルトに戻す
          reject(error); // エラーを通知
        });
    });
  }

  function removeOverlay(reference) {
    const overlay = reference.querySelector(".overlay");
    if (overlay) {
      overlay.remove();
    }

    // キャッシュの状態をリセット
    const articleUrl = getArticleUrl(reference);
    if (articleUrl) {
      const cachedData = urlCache.get(articleUrl) || {};
      urlCache.set(articleUrl, {
        ...cachedData,
        state: TOOLTIP_STATES.DEFAULT,
      });
    }
  }

  // 見出しをオーバーレイとして表示する関数
  function displayOverlay(data, reference, tooltip) {
    if (!data || !data.headline) {
      console.error("⚠️ データが無効です。", data);
      return;
    }

    const parentLi = reference.closest("li");
    if (!parentLi) {
      console.error("親<li>要素が見つかりませんでした。");
      return;
    }

    const parentWidth = parentLi.offsetWidth; // 親<li>要素の幅を取得

    // <a>タグのフォントサイズを取得
    const linkElement = reference.querySelector("a") || reference.closest("a");
    const fontSize = linkElement
      ? getComputedStyle(linkElement).fontSize
      : "14px"; // デフォルト値を設定

    const overlay = document.createElement("div");
    overlay.className = "overlay"; // クラス名を追加
    overlay.innerText = `💡 ${data.headline}`;
    Object.assign(overlay.style, {
      position: "absolute",
      bottom: "calc(100% + 4px)", // 吹き出しを親要素の上に配置
      left: "50%",
      transform: "translateX(-50%)", // 中央揃え
      width: `${parentWidth}px`, // 親<li>要素の幅を適用
      backgroundColor: "rgba(255, 255, 255, 0.9)", // 背景色を白に変更
      color: "rgba(0, 0, 0, 0.8)", // テキスト色を黒に変更
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: fontSize, // <a>タグのフォントサイズを適用
      boxShadow:
        "rgba(0, 0, 0, 0.1) 0px 4px 6px,0 0 0 1px rgba(74, 138, 87, 0.9)", // 影を追加
      borderRadius: "8px", // 角を丸くする
      padding: "4px", // 内側の余白を追加
      zIndex: "1000",
      pointerEvents: "none", // クリックを無効化
      textAlign: "center",
      "font-family": "BIZ UDPGothic", // フォントを指定
    });
    // 吹き出しの矢印をSVGで作成
    const arrowSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    arrowSvg.setAttribute("width", "20");
    arrowSvg.setAttribute("height", "10");
    arrowSvg.setAttribute("viewBox", "0 0 20 10");
    arrowSvg.style.position = "absolute";
    arrowSvg.style.bottom = "-10px"; // 吹き出しの下に配置
    arrowSvg.style.left = "80%";
    arrowSvg.style.transform = "translateX(-80%)";
    arrowSvg.style.zIndex = "999";

    // 吹き出しの矢印を作成
    const arrow = document.createElement("div");
    Object.assign(arrow.style, {
      content: '""',
      position: "absolute",
      bottom: "-6px", // 吹き出しの下に配置
      left: "80%",
      transform: "translateX(-80%)",
      width: "0",
      height: "0",
      borderLeft: "80px solid transparent", // 外側の枠の幅
      borderRight: "50px solid transparent",
      borderTop: "6px solid rgba(74, 138, 87, 0.9)", // 外側の枠の色（吹き出しの輪郭色）
      zIndex: "999", // 矢印をオーバーレイの下に配置
    });

    // 内側の矢印を作成
    const innerArrow = document.createElement("div");
    Object.assign(innerArrow.style, {
      content: '""',
      position: "absolute",
      bottom: "-4px", // 外側矢印の上に配置
      left: "80%",
      transform: "translateX(-80%)",
      width: "0",
      height: "0",
      borderLeft: "80px solid transparent", // 内側の矢印の幅
      borderRight: "50px solid transparent",
      borderTop: "4px solid rgba(230, 244, 234, 0.9)", // 内側の矢印の色（吹き出しの背景色）
      zIndex: "1000", // 内側矢印を外側矢印の上に配置
    });

    overlay.appendChild(arrow); // 外側矢印を追加
    overlay.appendChild(innerArrow); // 内側矢印を追加

    parentLi.style.position = "relative";
    parentLi.appendChild(overlay);

    // ボタンの状態を「×」に変更
    updateButtonState(tooltip, TOOLTIP_STATES.CLOSE);
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

    // クリックイベントを追加
    tooltip.addEventListener("click", (e) => {
      e.stopPropagation(); // イベントのバブリングを防ぐ
      e.preventDefault(); // デフォルトの動作を防ぐ

      // `<a>`タグを取得
      let articleUrl = null;
      let articleText = null;

      if (reference.tagName === "A") {
        articleUrl = reference.href; // referenceが<a>タグの場合
        articleText = reference.innerText; // <a>タグのテキストを取得
      } else if (reference.querySelector("a")) {
        articleUrl = reference.querySelector("a").href; // 子要素に<a>タグがある場合
        articleText = reference.querySelector("a").innerText; // <a>タグのテキストを取得
      } else {
        const parentLink = reference.closest("a"); // 親要素に<a>タグがあるか探索
        if (parentLink) {
          articleUrl = parentLink.href;
          articleText = parentLink.innerText; // 親要素の<a>タグのテキストを取得
        }
      }

      if (articleUrl) {
        console.log(`記事URL: ${articleUrl}`); // デバッグ用ログ
        console.log(`記事テキスト: ${articleText}`); // デバッグ用ログ
        fetchHeadline(articleUrl, reference, articleText, tooltip); // URLが存在する場合、見出しを取得
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
        left: `${x - 20}px`,
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

          // 親<li>要素のスタイルを調整 overflow: hidden;の場合overflowが正常に表示されないため
          const parentLi = reference.closest("li");
          if (parentLi) {
            parentLi.style.overflow = "visible"; // overflowをvisibleに変更
          }

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
            updateButtonState(tooltip, TOOLTIP_STATES.DEFAULT);
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
