const messagesEl = document.getElementById("messages");
let rootEl = document.getElementById("root");
let currentStyleElements = [];

export const postToParent = (message) => {
  window.parent.postMessage(message, "*");
};

export const setMessage = (text) => {
  if (!messagesEl) {
    return;
  }
  messagesEl.textContent = text;
};

export const resetRoot = () => {
  if (!rootEl) {
    return;
  }
  const fresh = rootEl.cloneNode(false);
  rootEl.replaceWith(fresh);
  rootEl = fresh;
};

export const applyCss = (cssChunks) => {
  if (currentStyleElements.length) {
    for (const styleEl of currentStyleElements) {
      styleEl.remove();
    }
    currentStyleElements = [];
  }

  if (!Array.isArray(cssChunks) || cssChunks.length === 0) {
    return;
  }

  for (const cssText of cssChunks) {
    if (typeof cssText !== "string" || !cssText.trim()) {
      continue;
    }
    const styleEl = document.createElement("style");
    styleEl.type = "text/css";
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
    currentStyleElements.push(styleEl);
  }
};
