type SplineViewerModule = typeof import("@splinetool/viewer");

let viewerModulePromise: Promise<SplineViewerModule> | null = null;

export const preloadSplineViewer = (): Promise<SplineViewerModule> => {
  if (viewerModulePromise) {
    return viewerModulePromise;
  }

  const pendingImport = import("@splinetool/viewer");
  viewerModulePromise = pendingImport;

  void pendingImport.catch(() => {
    if (viewerModulePromise === pendingImport) {
      viewerModulePromise = null;
    }
  });

  return pendingImport;
};
