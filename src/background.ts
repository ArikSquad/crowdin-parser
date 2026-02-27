import type { CrowdinPhrase, CrowdinResponse, Message } from "./types";
import { generatePropertiesFiles, filePathToPrefix } from "./generator";

// --- State ---
let listening = false;
let collectedPhrases: Map<number, CrowdinPhrase> = new Map(); // keyed by phrase id
let pagesCollected: Set<number> = new Set();
let totalPages: number | null = null;
let totalFound: number | null = null;

// --- Network interception via chrome.webRequest + fetch override ---
// We use a content script approach via declarativeNetRequest or devtools,
// but the most reliable way for reading response bodies is via a content script
// that hooks fetch/XHR. The background script coordinates state.

function getStatus(): Extract<Message, { type: "STATUS" }> {
  const fileGroups = new Set<string>();
  for (const phrase of collectedPhrases.values()) {
    fileGroups.add(filePathToPrefix(phrase.file_path || "/unknown"));
  }

  return {
    type: "STATUS",
    listening,
    phrasesCount: collectedPhrases.size,
    pagesCollected: [...pagesCollected].sort((a, b) => a - b),
    totalPages,
    found: totalFound,
    fileGroups: [...fileGroups].sort(),
  };
}

function handleCrowdinData(data: CrowdinResponse["data"]) {
  if (!listening) return;

  totalPages = data.pages;
  totalFound = data.found;
  pagesCollected.add(data.page);

  for (const phrase of data.phrases) {
    collectedPhrases.set(phrase.id, phrase);
  }

  console.log(
    `[Crowdin Parser] Page ${data.page}/${data.pages} collected. Total phrases: ${collectedPhrases.size}/${data.found}`,
  );
}

// Listen to messages from popup and content script
chrome.runtime.onMessage.addListener(
  (
    message: Message | { type: "CROWDIN_DATA"; data: CrowdinResponse["data"] },
    _sender,
    sendResponse,
  ) => {
    if (message.type === "GET_STATUS") {
      sendResponse(getStatus());
    } else if (message.type === "START_LISTENING") {
      listening = true;
      console.log("[Crowdin Parser] Started listening");
      sendResponse(getStatus());
    } else if (message.type === "STOP_LISTENING") {
      listening = false;
      console.log("[Crowdin Parser] Stopped listening");
      sendResponse(getStatus());
    } else if (message.type === "CLEAR_DATA") {
      collectedPhrases.clear();
      pagesCollected.clear();
      totalPages = null;
      totalFound = null;
      console.log("[Crowdin Parser] Data cleared");
      sendResponse(getStatus());
    } else if (message.type === "GENERATE_FILES") {
      const phrases = [...collectedPhrases.values()];
      const files = generatePropertiesFiles(phrases);
      const response: Extract<Message, { type: "FILES_READY" }> = {
        type: "FILES_READY",
        files,
      };
      sendResponse(response);
    } else if (message.type === "CROWDIN_DATA") {
      handleCrowdinData(
        (message as { type: "CROWDIN_DATA"; data: CrowdinResponse["data"] })
          .data,
      );
      sendResponse({ ok: true });
    }

    return true; // keep channel open for async sendResponse
  },
);

// Update badge when data changes
setInterval(() => {
  const count = collectedPhrases.size;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({
    color: listening ? "#4CAF50" : "#9E9E9E",
  });
}, 1000);
