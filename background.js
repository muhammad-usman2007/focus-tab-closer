// Focus Tab Closer - background service worker
// While focus is ON, your chosen work tab is the only tab allowed.
// Any other tab that gets opened is closed right away, unless its
// site is on your allowed list.

const DEFAULTS = {
  focusEnabled: false,
  workTabId: null,
  workWindowId: null,
  workTitle: "",
  workUrl: "",
  blockedCount: 0,
  allowlist: []
};

async function getState() {
  const data = await chrome.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...data };
}

async function setState(patch) {
  await chrome.storage.local.set(patch);
}

function isOwnPage(url) {
  return typeof url === "string" && url.startsWith("chrome-extension://" + chrome.runtime.id + "/");
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return "";
  }
}

function isAllowedUrl(url, allowlist) {
  if (!url) return false;
  if (isOwnPage(url)) return true;
  const host = hostnameOf(url);
  if (!host) return false;
  return (allowlist || []).some((entry) => {
    const d = String(entry || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return d && (host === d || host.endsWith("." + d));
  });
}

async function updateBadge(enabled) {
  try {
    await chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
    if (enabled) {
      await chrome.action.setBadgeBackgroundColor({ color: "#1a9e4b" });
    }
  } catch (e) { /* badge is cosmetic, ignore failures */ }
}

async function closeTab(tabId) {
  try {
    await chrome.tabs.remove(tabId);
    const state = await getState();
    await setState({ blockedCount: (state.blockedCount || 0) + 1 });
    return true;
  } catch (e) {
    return false;
  }
}

async function startFocus(tab) {
  await setState({
    focusEnabled: true,
    workTabId: tab.id,
    workWindowId: tab.windowId,
    workTitle: tab.title || "",
    workUrl: tab.url || tab.pendingUrl || "",
    blockedCount: 0
  });
  await updateBadge(true);

  // Close every other tab already open in this window.
  const others = await chrome.tabs.query({ windowId: tab.windowId });
  const state = await getState();
  for (const t of others) {
    if (t.id === tab.id) continue;
    if (isAllowedUrl(t.url || t.pendingUrl || "", state.allowlist)) continue;
    await closeTab(t.id);
  }
  try { await chrome.tabs.update(tab.id, { active: true }); } catch (e) {}
}

async function stopFocus() {
  await setState({ focusEnabled: false, workTabId: null, workWindowId: null, workTitle: "", workUrl: "" });
  await updateBadge(false);
}

// A brand new tab was opened anywhere: close it unless it is the work
// tab or an allowed site.
chrome.tabs.onCreated.addListener(async (tab) => {
  const state = await getState();
  if (!state.focusEnabled || state.workTabId == null) return;
  if (tab.id === state.workTabId) return;
  const url = tab.pendingUrl || tab.url || "";
  if (isAllowedUrl(url, state.allowlist)) return;
  await closeTab(tab.id);
});

// A tab navigated somewhere new: if it is not the work tab and the new
// site is not allowed, close it. Also keep the work tab info fresh.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const state = await getState();
  if (!state.focusEnabled || state.workTabId == null) return;
  if (tabId === state.workTabId) {
    if (changeInfo.title || changeInfo.url) {
      await setState({ workTitle: tab.title || state.workTitle, workUrl: tab.url || state.workUrl });
    }
    return;
  }
  if (!changeInfo.url) return;
  if (tab.windowId !== state.workWindowId) return;
  if (isAllowedUrl(changeInfo.url, state.allowlist)) return;
  await closeTab(tabId);
});

// Switching to some other tab inside the work window: close it and go
// back to the work tab, unless that tab is an allowed site.
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const state = await getState();
  if (!state.focusEnabled || state.workTabId == null) return;
  if (activeInfo.windowId !== state.workWindowId) return;
  if (activeInfo.tabId === state.workTabId) return;
  let tab = null;
  try { tab = await chrome.tabs.get(activeInfo.tabId); } catch (e) { return; }
  if (isAllowedUrl(tab.url || tab.pendingUrl || "", state.allowlist)) return;
  const closed = await closeTab(activeInfo.tabId);
  if (closed) {
    try { await chrome.tabs.update(state.workTabId, { active: true }); } catch (e) {}
  }
});

// If the work tab itself is closed, focus mode turns off.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await getState();
  if (state.focusEnabled && tabId === state.workTabId) {
    await stopFocus();
  }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const state = await getState();
  if (state.focusEnabled && windowId === state.workWindowId) {
    await stopFocus();
  }
});

// Messages from the popup.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg && msg.type === "START_FOCUS" && msg.tab) {
      await startFocus(msg.tab);
      sendResponse({ ok: true, state: await getState() });
    } else if (msg && msg.type === "STOP_FOCUS") {
      await stopFocus();
      sendResponse({ ok: true, state: await getState() });
    } else if (msg && msg.type === "GET_STATE") {
      sendResponse({ ok: true, state: await getState() });
    } else {
      sendResponse({ ok: false });
    }
  })();
  return true; // keep the message channel open for the async reply
});

// Restore the badge after the service worker restarts.
(async () => {
  const state = await getState();
  await updateBadge(!!state.focusEnabled);
})();
