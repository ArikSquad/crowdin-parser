const PHRASES_PATH = "/backend/phrases";

const originalFetch = window.fetch;
window.fetch = async function (...args: Parameters<typeof fetch>) {
  const input = args[0];
  const init = args[1] || {};
  const url =
    typeof input === "string"
      ? input
      : input instanceof Request
        ? input.url
        : "";
  const method = (
    init.method || (input instanceof Request ? input.method : "GET")
  ).toUpperCase();

  const response = await originalFetch.apply(this, args);

  try {
    if (method === "POST" && url.includes(PHRASES_PATH)) {
      const clone = response.clone();
      clone
        .json()
        .then((json: any) => {
          if (json?.data?.phrases && Array.isArray(json.data.phrases)) {
            console.log(
              `[Crowdin Parser] Intercepted fetch POST ${url} — ${json.data.phrases.length} phrases, page ${json.data.page}/${json.data.pages}`,
            );
            window.postMessage(
              { type: "CROWDIN_PARSER_DATA", payload: json.data },
              "*",
            );
          }
        })
        .catch(() => {});
    }
  } catch (_) {}

  return response;
};

const origOpen = XMLHttpRequest.prototype.open;
const origSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  ...rest: any[]
) {
  (this as any).__crowdinUrl = typeof url === "string" ? url : url.toString();
  (this as any).__crowdinMethod = (method || "GET").toUpperCase();
  return origOpen.apply(this, [method, url, ...rest] as any);
};

XMLHttpRequest.prototype.send = function (...args: any[]) {
  const url: string = (this as any).__crowdinUrl || "";
  const method: string = (this as any).__crowdinMethod || "GET";

  if (method === "POST" && url.includes(PHRASES_PATH)) {
    this.addEventListener("load", function () {
      try {
        const json = JSON.parse(this.responseText);
        if (json?.data?.phrases && Array.isArray(json.data.phrases)) {
          console.log(
            `[Crowdin Parser] Intercepted XHR POST ${url} — ${json.data.phrases.length} phrases, page ${json.data.page}/${json.data.pages}`,
          );
          window.postMessage(
            { type: "CROWDIN_PARSER_DATA", payload: json.data },
            "*",
          );
        }
      } catch (_) {}
    });
  }

  return origSend.apply(this, args as any);
};

console.log(
  `[Crowdin Parser] Network interceptor active — watching POST ${PHRASES_PATH}`,
);
