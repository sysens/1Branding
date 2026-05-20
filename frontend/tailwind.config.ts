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
        sans: ["SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["SF Pro Display", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        oswald: ["SF Pro Display", "SF Pro Text", "sans-serif"],
        inter: ["SF Pro Text", "sans-serif"],
        poppins: ["SF Pro Text", "sans-serif"],
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
    },
  },

  plugins: [],
};
