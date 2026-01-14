(() => {
  if (window.__AI_STUDIO_CHAT_BACKUP_LOADED__) return;
  window.__AI_STUDIO_CHAT_BACKUP_LOADED__ = true;

  console.log("[AI Studio Chat Backup] content.js injected", location.href);

  const TURN_SEL =
    ".virtual-scroll-container.user-prompt-container, .virtual-scroll-container.model-prompt-container";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function normalizeText(s) {
    return (s ?? "")
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isNoise(s) {
    if (!s) return true;
    if (/^[\.\-–—•·…]+$/.test(s)) return true;
    return false;
  }

  function parseTurnsNow() {
    const nodes = [...document.querySelectorAll(TURN_SEL)];
    return nodes
      .map((node) => {
        const role = node.classList.contains("user-prompt-container")
          ? "User"
          : "Model";
        const parts = [...node.querySelectorAll(".very-large-text-container")]
          .map((el) => normalizeText(el.innerText))
          .filter((t) => !isNoise(t));

        return { role, text: parts.join("\n\n") };
      })
      .filter((t) => t.text.length > 0);
  }

  function addTurns(acc, turns) {
    for (const t of turns) {
      const key = `${t.role}|${t.text.replace(/\s+/g, " ").slice(0, 300)}`;
      if (acc.seen.has(key)) continue;
      acc.seen.add(key);
      acc.list.push(t);
    }
  }

  async function collectAllByScrollingUp(scroller) {
    const acc = { seen: new Set(), list: [] };

    addTurns(acc, parseTurnsNow());

    let noNewRounds = 0;

    for (let i = 0; i < 2500; i++) {
      const beforeTop = scroller.scrollTop;

      const step = Math.max(250, Math.floor(scroller.clientHeight * 0.7));
      scroller.scrollTop = Math.max(0, beforeTop - step);

      await sleep(700);

      const beforeSize = acc.seen.size;
      addTurns(acc, parseTurnsNow());
      const afterSize = acc.seen.size;

      const newAdded = afterSize - beforeSize;

      if (newAdded === 0) noNewRounds++;
      else noNewRounds = 0;

      if (i % 30 === 0) {
        console.log(
          `[collect-up] i=${i} collected=${acc.list.length} newAdded=${newAdded} noNew=${noNewRounds} scrollTop=${scroller.scrollTop}`
        );
      }
      if (scroller.scrollTop === 0 || noNewRounds >= 25) break;
    }
    return acc.list.slice().reverse();
  }

  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function toTxt(turns) {
    return turns.map((t) => t.text).join("\n\n---\n\n") + "\n";
  }

  function makeFileBaseName() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `aistudio_chat_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  }

  async function exportChat() {
    try {
      const scroller = document.querySelector(
        "ms-autoscroll-container.hide-scrollbar"
      );
      if (!scroller) {
        alert("AI Studio scroller not found. Open a chat page first.");
        return;
      }

      console.log("[export] start");

      const turns = await collectAllByScrollingUp(scroller);

      console.log("[export] collected turns:", turns.length);

      if (turns.length === 0) {
        alert("No turns found.");
        return;
      }

      const base = makeFileBaseName();
      downloadText(`${base}.txt`, toTxt(turns), "text/plain");

      console.log("[export] download triggered");
    } catch (e) {
      console.error("[export] failed:", e);
      alert("Export failed. Check console (F12).");
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "EXPORT_CHAT") {
      exportChat();
      sendResponse({ ok: true });
    }
  });
})();
