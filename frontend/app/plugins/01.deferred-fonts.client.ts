// SF Pro faces that no page uses on its first screen (measured on every page,
// phone and desktop). Declared in CSS, the browser fetched them before the
// first paint because some text further down the page uses them; registered
// here, once the app is hydrated and idle, they load only when needed and swap
// in. (Registering them during hydration made the browser re-resolve text styles
// inside that task.)
const DEFERRED_FACES = [
  { family: "SF Pro Text", file: "SF-Pro-Text-Medium", weight: "500" },
  { family: "SF Pro Display", file: "SF-Pro-Display-Semibold", weight: "600" },
];

export default defineNuxtPlugin({
  name: "deferred-fonts",
  setup() {
    if (!("fonts" in document) || typeof FontFace === "undefined") return;
    onNuxtReady(() => {
      for (const face of DEFERRED_FACES) {
        document.fonts.add(new FontFace(face.family, `url(/fonts/v2/${face.file}.woff2) format("woff2")`, {
          weight: face.weight,
          style: "normal",
          display: "swap",
        }));
      }
    });
  },
});
