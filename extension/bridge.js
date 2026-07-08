// Runs only on the AutoJob web app's own origin (see manifest.json matches).
// Relays a tailored application package from the page into extension storage
// so content.js can pick it up on whatever site the user applies on next.
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== "autojob-web" || event.data.type !== "AUTOJOB_PACKAGE") return;

  const payload = event.data.payload;
  chrome.storage.local.set({
    autojobPackage: {
      ...payload,
      consumed: false,
      receivedAt: Date.now(),
    },
  });
});
