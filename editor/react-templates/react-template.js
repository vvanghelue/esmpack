export function getReactTemplateFiles() {
  const files = [];
  const ENTRY_FILE = "src/index.tsx";

  files.push(
    {
      path: "src/style.css",
      content: `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
}
  `,
    },
    {
      path: "src/index.tsx",
      content: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

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
    }
  );

  files.push({
    path: "src/App.tsx",
    content: `import React from "react";
import HelloWorld from "./components/HelloWorld";
import Counter from "./components/Counter.tsx";
import { BrowserRouter } from "react-router-dom";


export default function App() {
//throw new Error("Root element #root not found");

  React.useEffect(() => {
    async function fetchApi() {
      const res = await fetch("https://localhost:7676/api-proxy-v1/http://localhost:3018/insurance-contracts/api/v2/contracts");
      const data = await res.json();
      console.log(data);
    }
    fetchApi();
  }, []);

    return (
    <main>
        <HelloWorld name="ESM Pack" />
        <Counter />
    </main>
    );
}
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
  return { files, ENTRY_FILE };
}
