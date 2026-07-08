const statusEl = document.getElementById("status");
const backendInput = document.getElementById("backendUrl");

async function refresh() {
  const { autojobPackage } = await chrome.storage.local.get("autojobPackage");
  if (!autojobPackage) {
    statusEl.textContent = "No package yet — generate one from the AutoJob Apply page.";
    return;
  }
  const { job, consumed } = autojobPackage;
  statusEl.textContent = consumed
    ? `Last used: ${job.jobTitle} @ ${job.company}`
    : `Ready to auto-apply: ${job.jobTitle} @ ${job.company}`;
}

async function loadBackendUrl() {
  const { backendUrl } = await chrome.storage.sync.get("backendUrl");
  backendInput.value = backendUrl || "http://localhost:3000";
}

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({ backendUrl: backendInput.value.trim() });
  statusEl.textContent = "Backend URL saved.";
  setTimeout(refresh, 800);
});

document.getElementById("clear").addEventListener("click", async () => {
  await chrome.storage.local.remove("autojobPackage");
  refresh();
});

refresh();
loadBackendUrl();
