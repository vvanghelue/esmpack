import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import FileBrowser from "./file-browser/file-browser.js";
import { getReactTemplateFiles } from "./_react-template/_react-template.js";

const { files, ENTRY_FILE } = getReactTemplateFiles();

let currentFile = files.length ? files[0] : null;

document.querySelector("#root").style.display = "flex";
document.querySelector("#root").style.gap = "20px";

document.querySelector("#root").appendChild(document.createElement("div")).id =
  "file-browser";

document.querySelector("#root").appendChild(document.createElement("div")).id =
  "code-editor";

document.querySelector("#code-editor").style.height = "800px";
document.querySelector("#code-editor").style.width = "600px";

document.querySelector("#root").appendChild(document.createElement("div")).id =
  "iframe-container";

const iframe = document.createElement("iframe");
iframe.src = "/iframe/iframe.html";
iframe.style.width = "700px";
iframe.style.minHeight = "100vh";
document.querySelector("#iframe-container").appendChild(iframe);

let iframeReady = false;

iframe.addEventListener("load", () => {
  iframeReady = false;
});

const serializeFiles = () => files.map((file) => ({ ...file }));

const sendFilesToIframe = () => {
  if (!iframeReady || !iframe.contentWindow) {
    return;
  }
  iframe.contentWindow.postMessage(
    {
      type: "files-update",
      payload: {
        files: serializeFiles(),
        entry: ENTRY_FILE,
      },
    },
    "*"
  );
};

window.addEventListener("message", (event) => {
  if (event.source !== iframe.contentWindow) {
    return;
  }
  const { type, payload } = event.data || {};
  if (type === "iframe-ready") {
    iframeReady = true;
    sendFilesToIframe();
    return;
  }
  if (type === "files-ack") {
    console.log("Iframe acknowledged files update", payload);
    return;
  }
  console.log("Message from iframe", event.data);
});

const view = new EditorView({
  parent: document.body.querySelector("#code-editor"),
  doc: currentFile ? currentFile.content : "",
  extensions: [
    basicSetup,
    javascript({ jsx: true, typescript: true }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && currentFile) {
        currentFile.content = update.state.doc.toString();
        sendFilesToIframe();
      }
    }),
  ],
});

const fileBrowser = new FileBrowser(
  document.querySelector("#file-browser"),
  files,
  (path) => {
    const file = files.find((f) => f.path === path);
    if (file) {
      currentFile = file;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: file.content },
      });
      sendFilesToIframe();
    }
  }
);

if (currentFile) {
  fileBrowser.selectFile(currentFile.path);
}
