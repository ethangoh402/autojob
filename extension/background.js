const DEFAULT_BACKEND_URL = "http://localhost:3000";

chrome.runtime.onInstalled.addListener(async () => {
  const { backendUrl } = await chrome.storage.sync.get("backendUrl");
  if (!backendUrl) await chrome.storage.sync.set({ backendUrl: DEFAULT_BACKEND_URL });
});

// Badge reflects whether a not-yet-used application package is waiting.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.autojobPackage) return;
  const pkg = changes.autojobPackage.newValue;
  if (pkg && !pkg.consumed) {
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
});
