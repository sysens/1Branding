import type { Config } from "tailwindcss";

// ERTEX Group's colours and faces, as the brand book in the Standards
// section describes them.
export default {
  theme: {
    extend: {
      colors: {
        ertex: {
          ink: "#101820",
          muted: "#475766",
          rule: "#d3dbe1",
          blue: "#004dda",
          navy: "#032d6b",
          wash: "#f2f5f7",
          mat: "#e9edf1",
          focus: "#287cfa",
        },
      },
      fontFamily: {
        ertex: ["Inter", "Arial", "sans-serif"],
        // The CRM mock-up is drawn in the system UI face, as a real app would be.
        "ertex-ui": ["-apple-system", "BlinkMacSystemFont", "\"SF Pro Display\"", "Inter", "Arial", "sans-serif"],
      },
    },
  },
} satisfies Partial<Config>;
