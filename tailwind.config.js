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
      },
      animation: {
        shake: "shake 0.82s cubic-bezier(.36,.07,.19,.97) both"
      },
      keyframes: {
        shake: {
          "10%, 90%": {
            transform: "translate3d(-1px, 0, 0)"
          },
          "20%, 80%": {
            transform: "translate3d(2px, 0, 0)"
          },
          "30%, 50%, 70%": {
            transform: "translate3d(-4px, 0, 0)"
          },
          "40%, 60%": {
            transform: "translate3d(4px, 0, 0)"
          }
        }
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
