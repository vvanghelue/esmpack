let esbuildPromise;

export const ensureEsbuild = () => {
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
