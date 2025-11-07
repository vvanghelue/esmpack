const fileDump = document.getElementById("file-dump");

const renderFiles = (incomingFiles) => {
  const safeFiles = Array.isArray(incomingFiles) ? incomingFiles : [];
  fileDump.textContent = JSON.stringify(safeFiles, null, 2);
};

const postToParent = (message) => {
  window.parent.postMessage(message, "*");
};

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) {
    return;
  }
  const { type, payload } = event.data || {};
  if (type === "files-update") {
    renderFiles(payload);
    postToParent({
      type: "files-ack",
      payload: {
        fileCount: Array.isArray(payload) ? payload.length : 0,
      },
    });
  }
});

postToParent({ type: "iframe-ready" });
