chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !tab.url) return;
  if (!tab.url.startsWith("https://aistudio.google.com/")) return;

  try {
    const [{ result: already }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!window.__AI_STUDIO_CHAT_BACKUP_LOADED__,
    });

    if (!already) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    }

    chrome.tabs.sendMessage(tab.id, { type: "EXPORT_CHAT" });
  } catch (e) {
    console.error("Injection failed:", e);
  }
});
