import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import FileBrowser from "./file-browser/file-browser.js";

const files = [];

files.push({
  path: "src/index.tsx",
  content: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
});

files.push({
  path: "src/App.tsx",
  content: `import React from "react";
import HelloWorld from "./components/HelloWorld.tsx";
import Counter from "./components/Counter.tsx";

const App = () => (
  <main>
    <HelloWorld name="ESM Pack" />
    <Counter />
  </main>
);

export default App;
`,
});

files.push({
  path: "src/components/HelloWorld.tsx",
  content: `import React from "react";

const HelloWorld = ({ name = "React" }) => (
  <section>
    <h1>Hello, {name}!</h1>
    <p>Welcome to your iframe-powered React playground.</p>
  </section>
);

export default HelloWorld;
`,
});

files.push({
  path: "src/components/Counter.tsx",
  content: `import React from "react";

const Counter = () => {
  const [count, setCount] = React.useState(0);

  return (
    <section>
      <h2>Counter</h2>
      <p>The button has been clicked {count} times.</p>
      <div>
        <button onClick={() => setCount((value) => value + 1)}>
          Increment
        </button>
        <button onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
    </section>
  );
};

export default Counter;
`,
});

files.push({
  path: "index.txt",
  content: `Minimal React + TypeScript demo\n\n- src/index.tsx bootstraps the React root and renders <App />.\n- src/App.tsx wires HelloWorld and Counter components.\n- src/components/HelloWorld.tsx greets the user.\n- src/components/Counter.tsx provides an interactive counter demo.\n`,
});

let currentFile = files.length ? files[0] : null;

document.querySelector("#root").style.display = "flex";
document.querySelector("#root").style.gap = "20px";

document.querySelector("#root").appendChild(document.createElement("div")).id =
  "file-browser";

document.querySelector("#root").appendChild(document.createElement("div")).id =
  "code-editor";

document.querySelector("#code-editor").style.height = "600px";
document.querySelector("#code-editor").style.width = "600px";

document.querySelector("#root").appendChild(document.createElement("div")).id =
  "iframe-container";

const iframe = document.createElement("iframe");
iframe.src = "/iframe/iframe.html";
iframe.style.width = "700px";
iframe.style.height = "400px";
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
      payload: serializeFiles(),
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
