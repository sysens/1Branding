import type { Config } from "tailwindcss";

export default <Config>{
  content: [
    "./app.vue",
    "./error.vue",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./plugins/**/*.{js,ts}",
    "./composables/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
    "./app/**/*.{vue,js,ts}",
  ],

  theme: {
    extend: {
      fontFamily: {
        oswald: ["Oswald", "sans-serif"],
      },

      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },

      animation: {
        marquee: "marquee 120s linear infinite",
      },
      fontFamily: {
  inter: ["Inter", "sans-serif"],
}

    },
  },

  plugins: [],
};
