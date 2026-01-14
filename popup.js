document.getElementById("exportBtn").addEventListener("click", async () => {
  const lang = (navigator.language || "en").toLowerCase();
  const isKo = lang.startsWith("ko");

  const t = {
    noContentScript: isKo
      ? `이 페이지에서는 실행할 수 없습니다.\nAI Studio 채팅 화면인지 확인해주세요.\n\n에러: `
      : `Cannot run on this page.\nMake sure you're on an AI Studio chat page.\n\nError: `,
    deliveredButNotStarted: isKo
      ? "메시지는 전달됐지만 export가 시작되지 않았습니다. 콘솔(F12)을 확인해주세요."
      : "Message delivered, but export did not start. Check the console (F12).",
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: "EXPORT_CHAT" }, (res) => {
    const err = chrome.runtime.lastError;

    if (err) {
      alert(t.noContentScript + err.message);
      return;
    }

    if (res?.ok) {
      window.close();
      return;
    }

    alert(t.deliveredButNotStarted);
  });
});
