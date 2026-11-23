import type { Config } from "tailwindcss";
import ertex from "./app/sites/ertex/tailwind";

// Each site brings its own colours and fonts as a preset, under its own
// name (bg-ertex-navy, font-ertex), so sites never share or override tokens.
export default <Config>{
  content: [
    "./app/**/*.{vue,js,ts}",
    "./shared/**/*.ts",
  ],
  presets: [ertex],
  plugins: [],
};
