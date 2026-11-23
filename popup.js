// Focus Tab Closer - popup logic

const dot = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const workBox = document.getElementById("workBox");
const workTitle = document.getElementById("workTitle");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const allowlistEl = document.getElementById("allowlist");
const saveBtn = document.getElementById("saveBtn");
const countEl = document.getElementById("count");
const msgEl = document.getElementById("msg");

function render(state) {
  const on = !!state.focusEnabled;
  dot.classList.toggle("on", on);
  statusText.textContent = on ? "Focus is ON" : "Focus is off";
  startBtn.hidden = on;
  stopBtn.hidden = !on;
  if (on) {
    workBox.hidden = false;
    workTitle.textContent = state.workTitle || state.workUrl || "Your work tab";
    countEl.textContent = "Tabs closed this session: " + (state.blockedCount || 0);
  } else {
    workBox.hidden = true;
    countEl.textContent = "";
  }
  const saved = (state.allowlist || []).join("\n");
  if (document.activeElement !== allowlistEl && allowlistEl.value !== saved) {
    allowlistEl.value = saved;
  }
}

async function refresh() {
  const res = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (res && res.ok) render(res.state);
}

startBtn.addEventListener("click", async () => {
  msgEl.textContent = "";
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];
  if (!tab || tab.id == null) {
    msgEl.textContent = "Could not find the current tab. Try again.";
    return;
  }
  const res = await chrome.runtime.sendMessage({
    type: "START_FOCUS",
    tab: { id: tab.id, windowId: tab.windowId, title: tab.title || "", url: tab.url || tab.pendingUrl || "" }
  });
  if (res && res.ok) {
    render(res.state);
    msgEl.textContent = "Focus is on. Other tabs in this window were closed.";
  }
});

stopBtn.addEventListener("click", async () => {
  const res = await chrome.runtime.sendMessage({ type: "STOP_FOCUS" });
  if (res && res.ok) {
    render(res.state);
    msgEl.textContent = "Focus is off. You can open tabs normally again.";
  }
});

saveBtn.addEventListener("click", async () => {
  const list = allowlistEl.value
    .split("\n")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  await chrome.storage.local.set({ allowlist: list });
  msgEl.textContent = "Allowed sites saved.";
  refresh();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") refresh();
});

refresh();
