const messagesEl = document.getElementById("messages");
let rootEl = document.getElementById("root");
let esbuildPromise;
let currentModuleUrl = null;
let buildCounter = 0;

const postToParent = (message) => {
  window.parent.postMessage(message, "*");
};

const setMessage = (text) => {
  messagesEl.textContent = text;
};

const resetRoot = () => {
  const fresh = rootEl.cloneNode(false);
  rootEl.replaceWith(fresh);
  rootEl = fresh;
};

const ensureImportMap = (() => {
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

const ensureEsbuild = () => {
  if (!esbuildPromise) {
    esbuildPromise = (async () => {
      const esbuildModule = await import(
        "https://esm.sh/esbuild-wasm@0.20.2?bundle"
      );
      const esbuild = esbuildModule?.initialize
        ? esbuildModule
        : esbuildModule?.default?.initialize
          ? esbuildModule.default
          : esbuildModule?.esbuild;

      if (!esbuild || typeof esbuild.initialize !== "function") {
        throw new Error("Failed to load esbuild-wasm initialize function.");
      }

      await esbuild.initialize({
        wasmURL: "https://esm.sh/esbuild-wasm@0.20.2/esbuild.wasm",
        worker: true,
      });
      return esbuild;
    })();
  }
  return esbuildPromise;
};

const normalizePath = (path) => {
  if (typeof path !== "string") {
    return "";
  }
  return path.replace(/^\.\//, "").replace(/^\/+/, "");
};

const resolveRelativePath = (importer, specifier) => {
  const base = importer ? normalizePath(importer) : "";
  const baseUrl = new URL(base || ".", "https://app.local/");
  const resolved = new URL(specifier, baseUrl);
  return resolved.pathname.replace(/^\/+/, "");
};

const dirname = (path) => {
  const normalized = normalizePath(path);
  const parts = normalized.split("/");
  parts.pop();
  return parts.join("/");
};

const loaderForPath = (path) => {
  const normalized = normalizePath(path);
  const base = normalized.split("/").pop() ?? "";
  if (!base.includes(".")) return "tsx";
  if (normalized.endsWith(".tsx")) return "tsx";
  if (normalized.endsWith(".ts")) return "ts";
  if (normalized.endsWith(".jsx")) return "jsx";
  if (normalized.endsWith(".json")) return "json";
  if (normalized.endsWith(".css")) return "css";
  if (normalized.endsWith(".txt")) return "text";
  return "js";
};

const resolveToExistingPath = (path, files) => {
  const extensionFallbacks = [".tsx", ".ts", ".jsx", ".js", ".json", ".css"];
  if (!path) {
    return null;
  }
  if (files.has(path)) {
    return path;
  }
  for (const ext of extensionFallbacks) {
    const withExt = `${path}${ext}`;
    if (files.has(withExt)) {
      return withExt;
    }
  }
  if (!path.endsWith("/")) {
    for (const ext of extensionFallbacks) {
      const indexPath = `${path}/index${ext}`;
      if (files.has(indexPath)) {
        return indexPath;
      }
    }
  }
  return null;
};

const buildBundle = async (files, entry) => {
  const esbuild = await ensureEsbuild();
  const fileMap = new Map();
  for (const file of files) {
    if (!file || typeof file.path !== "string") {
      continue;
    }
    fileMap.set(normalizePath(file.path), file.content ?? "");
  }

  const entryPath = normalizePath(entry);
  if (!entryPath || !fileMap.has(entryPath)) {
    throw new Error(`Entry file not found: ${entry}`);
  }

  const virtualFsPlugin = {
    name: "virtual-fs",
    setup(build) {
      // Resolve project-relative modules out of the in-memory map.
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === "entry-point") {
          return { path: entryPath, namespace: "virtual" };
        }

        if (args.namespace === "virtual") {
          if (args.path.startsWith(".") || args.path.startsWith("/")) {
            const resolved = resolveRelativePath(args.importer, args.path);
            const target = resolveToExistingPath(resolved, fileMap);
            if (target) {
              return { path: target, namespace: "virtual" };
            }
          } else {
            const direct = normalizePath(args.path);
            const target = resolveToExistingPath(direct, fileMap);
            if (target) {
              return { path: target, namespace: "virtual" };
            }
          }
        }

        if (args.path.startsWith(".") || args.path.startsWith("/")) {
          const importer = args.importer;
          const resolved = resolveRelativePath(importer, args.path);
          const target = resolveToExistingPath(resolved, fileMap);
          if (target) {
            return { path: target, namespace: "virtual" };
          }
        }

        return { path: args.path, external: true };
      });

      build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
        if (!fileMap.has(args.path)) {
          return null;
        }
        const contents = fileMap.get(args.path);
        const loader = loaderForPath(args.path);
        const dir = dirname(args.path);
        return {
          contents,
          loader,
          resolveDir: dir ? `/${dir}` : "/",
        };
      });
    },
  };

  const result = await esbuild.build({
    entryPoints: [entryPath],
    write: false,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2022"],
    jsx: "automatic",
    jsxImportSource: "react",
    logLevel: "silent",
    plugins: [virtualFsPlugin],
  });

  const warnings =
    result.warnings && result.warnings.length
      ? await esbuild.formatMessages(result.warnings, {
          kind: "warning",
          color: false,
        })
      : [];

  const output = result.outputFiles?.[0]?.text ?? "";
  return { code: output, warnings };
};

const runBundle = async (bundleCode) => {
  if (currentModuleUrl) {
    URL.revokeObjectURL(currentModuleUrl);
    currentModuleUrl = null;
  }
  resetRoot();
  const blob = new Blob([bundleCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  currentModuleUrl = url;
  ensureImportMap();
  await import(url);
};

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
    const { code, warnings } = await buildBundle(files, entry);
    if (token !== buildCounter) {
      return;
    }

    if (!code.trim()) {
      throw new Error("Bundle is empty. Check your entry file exports.");
    }

    await runBundle(code);
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

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) {
    return;
  }
  const { type, payload } = event.data || {};
  if (type === "files-update") {
    handleFilesUpdate(payload);
  }
});

postToParent({ type: "iframe-ready" });
