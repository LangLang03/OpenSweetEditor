export async function loadSweetEditorCore(options = {}) {
  const { moduleFactory, modulePath, moduleOptions = {} } = options;

  let factory = moduleFactory;
  let moduleBaseUrl = null;
  if (!factory) {
    if (!modulePath) {
      throw new Error("modulePath or moduleFactory is required to load SweetEditor wasm module.");
    }
    moduleBaseUrl = new URL(modulePath, import.meta.url);
    const imported = await import(moduleBaseUrl.href);
    factory = imported.default || imported.createSweetEditorModule || imported;
  }

  if (typeof factory !== "function") {
    throw new Error("Invalid wasm module factory.");
  }

  const finalOptions = { ...moduleOptions };
  if (moduleBaseUrl && typeof finalOptions.locateFile !== "function") {
    finalOptions.locateFile = (path) => {
      const url = new URL(path, moduleBaseUrl);
      if (moduleBaseUrl.search && !url.search) {
        url.search = moduleBaseUrl.search;
      }
      return url.href;
    };
  }

  return factory(finalOptions);
}
