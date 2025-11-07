import { postToParent, setMessage } from "./dom.js";
import { buildBundle, runBundle } from "./bundler/bundle.js";

let buildCounter = 0;

const handleFilesUpdate = async (payload) => {
  const files = Array.isArray(payload?.files) ? payload.files : [];
  const entry = payload?.entry ?? files[0]?.path;
  const token = ++buildCounter;

  if (!entry) {
    const error = "No entry file provided.";
    setMessage(`Build failed:\n${error}`);
    postToParent({
      type: "files-ack",
      payload: { fileCount: files.length, success: false, error },
    });
    return;
  }

  try {
    setMessage("Building preview...");
    const { code, css, warnings } = await buildBundle(files, entry);
    if (token !== buildCounter) {
      return;
    }

    if (!code.trim()) {
      throw new Error("Bundle is empty. Check your entry file exports.");
    }

    await runBundle(code, css);
    if (token !== buildCounter) {
      return;
    }

    const warningText = warnings.length
      ? `\nWarnings:\n${warnings.join("\n")}`
      : "";
    setMessage(`Rendered ${entry || "entry"} successfully.${warningText}`);
    postToParent({
      type: "files-ack",
      payload: { fileCount: files.length, success: true, warnings },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setMessage(`Build failed:\n${message}`);
    console.error(error);
    if (token === buildCounter) {
      postToParent({
        type: "files-ack",
        payload: { fileCount: files.length, success: false, error: message },
      });
    }
  }
};

export const registerParentMessageListener = () => {
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) {
      return;
    }
    const { type, payload } = event.data || {};
    if (type === "files-update") {
      void handleFilesUpdate(payload);
    }
  });
};
