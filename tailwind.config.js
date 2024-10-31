/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/(experimental)/**/*.{ts,tsx}",
    "./components-new/**/*.{ts,tsx}",
    "./icons/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        md: "805px",
        short: {raw: "(max-height: 600px)"}
      },
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          250: "var(--color-primary-250)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)"
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
