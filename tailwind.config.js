/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/(experimental)/**/*.{ts,tsx}",
    "./components-new/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F9F9F9",
          100: "#FAC8DD",
          200: "#F18CA2",
          250: "#E08297",
          300: "#E65654",
          400: "#BA425A",
          500: "#8E3058",
          600: "#602049",
          700: "#40353E"
        }
      },
      fontFamily: {
        tiny5: ["var(--font-tiny5)"],
        handjet: ["var(--font-handjet)"]
      }
    }
  },
  plugins: [
    function ({addBase, theme}) {
      function extractColorVars(colorObj, colorGroup = "") {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];

          const newVars =
            typeof value === "string"
              ? {[`--color${colorGroup}-${colorKey}`]: value}
              : extractColorVars(value, `-${colorKey}`);

          return {...vars, ...newVars};
        }, {});
      }

      addBase({
        ":root": extractColorVars(theme("colors"))
      });
    }
  ]
};
