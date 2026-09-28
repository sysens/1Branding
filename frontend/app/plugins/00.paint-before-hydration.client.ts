// The module scripts are usually downloaded before the browser has painted the
// server-rendered HTML, and hydration then ran first: the page stayed blank for
// the whole hydration task (~250 ms here, about 1 s on a mid-range phone).
// Waiting for one frame lets the ready HTML appear before Vue takes over. The
// timeout covers background tabs, where requestAnimationFrame does not fire.
export default defineNuxtPlugin({
  name: "paint-before-hydration",
  enforce: "pre",
  async setup() {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 100);
      requestAnimationFrame(() => setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 0));
    });
  },
});
