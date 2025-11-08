const OVERLAY_ID = "esmpack-error-overlay";
const OVERLAY_TITLE = "Runtime Error";

const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const ensureOverlay = () => {
  let overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("role", "alert");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.background = "rgba(136, 0, 0, 0.92)";
  overlay.style.color = "#fff";
  overlay.style.padding = "32px";
  overlay.style.overflowY = "auto";
  overlay.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
  overlay.style.boxSizing = "border-box";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.gap = "18px";

  document.body.appendChild(overlay);
  return overlay;
};

const normalizeError = (value) => {
  if (value instanceof Error) {
    return {
      message: value.message || "Unknown error",
      stack: value.stack || value.message || "(no stack trace)",
    };
  }

  try {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return {
      message: text || "Unknown error",
      stack: text || "(no stack trace)",
    };
  } catch {
    return { message: "Unknown error", stack: "(no stack trace)" };
  }
};

const renderOverlay = (title, message, stack) => {
  const overlay = ensureOverlay();
  overlay.innerHTML = "";

  const heading = document.createElement("div");
  heading.textContent = title;
  heading.style.fontSize = "20px";
  heading.style.fontWeight = "700";

  const summary = document.createElement("div");
  summary.innerHTML = escapeHtml(message);
  summary.style.fontSize = "16px";
  summary.style.whiteSpace = "pre-wrap";

  const stackBlock = document.createElement("pre");
  stackBlock.innerHTML = escapeHtml(stack);
  stackBlock.style.margin = "0";
  stackBlock.style.padding = "20px";
  stackBlock.style.borderRadius = "12px";
  stackBlock.style.background = "rgba(15, 23, 42, 0.35)";
  stackBlock.style.fontSize = "14px";
  stackBlock.style.lineHeight = "1.5";
  stackBlock.style.whiteSpace = "pre-wrap";
  stackBlock.style.wordBreak = "break-word";

  overlay.appendChild(heading);
  overlay.appendChild(summary);
  overlay.appendChild(stackBlock);
};

const handleRuntimeError = (value, origin) => {
  console.error(value);
  const { message, stack } = normalizeError(value);
  const title = origin ? `${OVERLAY_TITLE} (${origin})` : OVERLAY_TITLE;
  renderOverlay(title, message, stack);
};

export const clearErrorOverlay = () => {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
};

export const installGlobalErrorHandler = () => {
  if (window.__esmpackErrorHandlerInstalled) {
    return;
  }
  window.__esmpackErrorHandlerInstalled = true;

  window.addEventListener(
    "error",
    (event) => {
      if (!event) {
        return;
      }
      event.preventDefault();
      const error = event.error || new Error(event.message || "Unknown error");
      handleRuntimeError(error, "error");
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (!event) {
        return;
      }
      event.preventDefault();
      handleRuntimeError(event.reason, "unhandledrejection");
    },
    true
  );
};

export const showErrorOverlay = (error) => {
  handleRuntimeError(error);
};
