chrome.runtime.onInstalled.addListener(() => {
  console.log("拡張機能がインストールされました");
});

// メッセージを受け取ってポップアップを開く
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup(); // ポップアップを開く
    sendResponse({ status: "Popup opened" });
  }
});
