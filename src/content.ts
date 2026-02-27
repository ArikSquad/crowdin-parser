window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "CROWDIN_PARSER_DATA") return;

  chrome.runtime.sendMessage(
    { type: "CROWDIN_DATA", data: event.data.payload },
    () => {
      if (chrome.runtime.lastError) {
      }
    },
  );
});
