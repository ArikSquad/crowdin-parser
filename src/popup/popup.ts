import type { Message, GeneratedFile } from "../types";

const statusDot = document.getElementById("status-dot")!;
const statusText = document.getElementById("status-text")!;
const phrasesCount = document.getElementById("phrases-count")!;
const pagesInfo = document.getElementById("pages-info")!;
const totalFound = document.getElementById("total-found")!;
const fileGroups = document.getElementById("file-groups")!;
const pagesCollectedContainer = document.getElementById(
  "pages-collected-container",
)!;
const pagesCollectedList = document.getElementById("pages-collected-list")!;
const btnToggle = document.getElementById("btn-toggle") as HTMLButtonElement;
const btnClear = document.getElementById("btn-clear") as HTMLButtonElement;
const btnGenerate = document.getElementById(
  "btn-generate",
) as HTMLButtonElement;
const downloadArea = document.getElementById("download-area")!;
const fileList = document.getElementById("file-list")!;

let isListening = false;

function updateUI(status: Extract<Message, { type: "STATUS" }>) {
  isListening = status.listening;

  statusDot.className = `dot${status.listening ? " listening" : ""}`;
  statusText.textContent = status.listening ? "Listening..." : "Idle";

  phrasesCount.textContent = String(status.phrasesCount);
  pagesInfo.textContent = `${status.pagesCollected.length} / ${status.totalPages ?? "?"}`;
  totalFound.textContent = status.found != null ? String(status.found) : "—";
  fileGroups.textContent =
    status.fileGroups.length > 0 ? status.fileGroups.join(", ") : "—";

  if (status.pagesCollected.length > 0) {
    pagesCollectedContainer.style.display = "block";
    pagesCollectedList.innerHTML = status.pagesCollected
      .map((p) => `<span class="page-tag">${p}</span>`)
      .join("");
  } else {
    pagesCollectedContainer.style.display = "none";
  }

  btnToggle.textContent = status.listening
    ? "Stop Listening"
    : "Start Listening";
  btnToggle.classList.toggle("active", status.listening);

  btnGenerate.disabled = status.phrasesCount === 0;
}

function refreshStatus() {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response) updateUI(response);
  });
}

btnToggle.addEventListener("click", () => {
  const type = isListening ? "STOP_LISTENING" : "START_LISTENING";
  chrome.runtime.sendMessage({ type }, (response) => {
    if (response) updateUI(response);
  });
});

btnClear.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CLEAR_DATA" }, (response) => {
    if (response) updateUI(response);
  });
  downloadArea.style.display = "none";
  fileList.innerHTML = "";
});

btnGenerate.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "GENERATE_FILES" }, (response) => {
    if (response?.type === "FILES_READY") {
      showFiles(response.files);
    }
  });
});

function showFiles(files: GeneratedFile[]) {
  downloadArea.style.display = "block";
  fileList.innerHTML = "";

  for (const file of files) {
    const item = document.createElement("div");
    item.className = "file-item";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.filename;

    const btn = document.createElement("button");
    btn.className = "file-download";
    btn.textContent = "Download";
    btn.addEventListener("click", () => downloadFile(file));

    item.appendChild(name);
    item.appendChild(btn);
    fileList.appendChild(item);
  }

  const allBtn = document.createElement("button");
  allBtn.className = "file-download";
  allBtn.style.marginTop = "8px";
  allBtn.style.width = "100%";
  allBtn.textContent = "Download All";
  allBtn.addEventListener("click", () => {
    for (const file of files) {
      downloadFile(file);
    }
  });
  fileList.appendChild(allBtn);
}

function downloadFile(file: GeneratedFile) {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.filename;
  a.click();
  URL.revokeObjectURL(url);
}

refreshStatus();
setInterval(refreshStatus, 2000);
