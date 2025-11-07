export const ensureImportMap = (() => {
  let applied = false;
  const imports = {
    react: "https://esm.sh/react@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@18.3.1/jsx-dev-runtime",
    "react-router-dom": "https://esm.sh/react-router-dom@latest",
  };
  return () => {
    if (applied) {
      return;
    }
    const script = document.createElement("script");
    script.type = "importmap";
    script.textContent = JSON.stringify({ imports });
    document.head.appendChild(script);
    applied = true;
  };
})();
