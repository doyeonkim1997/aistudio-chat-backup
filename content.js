(() => {
  if (window.__AI_STUDIO_CHAT_BACKUP_LOADED__) return;
  window.__AI_STUDIO_CHAT_BACKUP_LOADED__ = true;

  console.log("[AI Studio Chat Backup] content.js injected", location.href);

  const TURN_SEL = ".chat-turn-container";

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

  function getRoleFromTurn(turnEl) {
    if (turnEl.classList.contains("user")) return "User";
    if (turnEl.classList.contains("model")) return "Model";

    const roleNode = turnEl.querySelector("[data-turn-role]");
    const role = roleNode?.getAttribute("data-turn-role");
    if (role === "User" || role === "Model") return role;

    const author = turnEl.querySelector(".author-label")?.textContent?.trim();
    if (author === "User" || author === "Model") return author;

    return "Unknown";
  }

  function getTurnKey(turnEl, role, text) {
    const chunkId = turnEl
      .querySelector("ms-prompt-chunk[id]")
      ?.getAttribute("id");
    if (chunkId) return chunkId;
    return `${role}|${text.replace(/\s+/g, " ").slice(0, 300)}`;
  }

  function parseTurnsInDomOrder() {
    const nodes = [...document.querySelectorAll(TURN_SEL)];

    return nodes
      .map((turnEl) => {
        const role = getRoleFromTurn(turnEl);

        const parts = [...turnEl.querySelectorAll(".very-large-text-container")]
          .map((el) => normalizeText(el.innerText))
          .filter((t) => !isNoise(t));

        const text = parts.join("\n\n").trim();
        if (!text) return null;

        return { role, text, _key: getTurnKey(turnEl, role, text) };
      })
      .filter(Boolean);
  }

  function addTurnsInOrder(acc, turns) {
    for (const t of turns) {
      if (acc.seen.has(t._key)) continue;
      acc.seen.add(t._key);
      acc.list.push({ role: t.role, text: t.text });
    }
  }

  async function loadAllToTop(scroller) {
    let noProgressRounds = 0;

    for (let i = 0; i < 3000; i++) {
      const beforeTop = scroller.scrollTop;
      const beforeHeight = scroller.scrollHeight;

      const step = Math.max(250, Math.floor(scroller.clientHeight * 0.7));
      scroller.scrollTop = Math.max(0, beforeTop - step);

      await sleep(700);

      const afterTop = scroller.scrollTop;
      const afterHeight = scroller.scrollHeight;

      const progressed = afterTop !== beforeTop || afterHeight !== beforeHeight;

      if (!progressed) noProgressRounds++;
      else noProgressRounds = 0;

      if (i % 40 === 0) {
        console.log(
          `[load-top] i=${i} scrollTop=${scroller.scrollTop} scrollHeight=${scroller.scrollHeight} noProgress=${noProgressRounds}`
        );
      }

      if (scroller.scrollTop === 0 || noProgressRounds >= 30) break;
    }

    console.log("[export] loaded to top");
  }

  async function collectAllByScrollingDownOrdered(scroller) {
    const acc = { seen: new Set(), list: [] };

    let noNewRounds = 0;

    for (let i = 0; i < 4000; i++) {
      const beforeSize = acc.seen.size;
      addTurnsInOrder(acc, parseTurnsInDomOrder());
      const afterSize = acc.seen.size;

      const newAdded = afterSize - beforeSize;
      if (newAdded === 0) noNewRounds++;
      else noNewRounds = 0;

      const beforeTop = scroller.scrollTop;
      const step = Math.max(250, Math.floor(scroller.clientHeight * 0.9));
      scroller.scrollTop = Math.min(scroller.scrollHeight, beforeTop + step);

      await sleep(450);

      const atBottom =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;

      if (i % 50 === 0) {
        console.log(
          `[collect-down] i=${i} collected=${acc.list.length} newAdded=${newAdded} noNew=${noNewRounds} scrollTop=${scroller.scrollTop}`
        );
      }

      if (atBottom && noNewRounds >= 20) break;
    }

    return acc.list;
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
    const width = String(turns.length).length;
    const pad = (n) => String(n).padStart(width, "0");

    return (
      turns.map((t, i) => `#${pad(i + 1)}\n\n${t.text}`).join("\n\n") + "\n"
    );
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

      scroller.scrollTop = scroller.scrollHeight;
      await sleep(300);

      await loadAllToTop(scroller);

      scroller.scrollTop = 0;
      await sleep(300);

      const turns = await collectAllByScrollingDownOrdered(scroller);

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
