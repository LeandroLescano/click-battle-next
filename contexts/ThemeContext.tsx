"use client";

import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  useCallback,
  memo
} from "react";
import chroma from "chroma-js";
import {useDebouncedCallback} from "hooks/debounce";

export type Theme = "blue" | "pink" | "custom";

type Themes = {
  theme: Theme;
  requiresLogin: boolean;
}[];

export const THEMES: Themes = [
  {
    theme: "blue",
    requiresLogin: false
  },
  {
    theme: "pink",
    requiresLogin: false
  },
  {
    theme: "custom",
    requiresLogin: true
  }
];

type CafecitoVariant = 2 | 6;

const CAFECITO_VARIANTS: {[key in Theme]: CafecitoVariant} = {
  blue: 6,
  pink: 2,
  custom: 6
};

interface ThemeContextState {
  theme: Theme;
  cafecitoVariant: CafecitoVariant;
  customColor?: string;
  clear: VoidFunction;
  changeTheme: (theme: Theme) => void;
  changeCustomColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextState>({
  theme: "blue",
  cafecitoVariant: 6,
  clear: () => {},
  changeTheme: () => {},
  changeCustomColor: () => {}
});

interface Props {
  children: JSX.Element;
}

export const ThemeProvider = memo(({children}: Props) => {
  const theme = useThemeProvider();

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`theme-${theme.theme} transition-all`}>{children}</div>
    </ThemeContext.Provider>
  );
});

ThemeProvider.displayName = "ThemeProvider";

export const useTheme = () => {
  return useContext(ThemeContext);
};

const generatePalette = (baseColor: string) => {
  return {
    "--color-primary-50": chroma(baseColor).brighten(3).hex(),
    "--color-primary-100": chroma(baseColor).brighten(2).hex(),
    "--color-primary-200": chroma(baseColor).brighten(1).hex(),
    "--color-primary-250": chroma(baseColor).brighten(0.5).hex(),
    "--color-primary-300": chroma(baseColor).hex(),
    "--color-primary-400": chroma(baseColor).darken(1).hex(),
    "--color-primary-500": chroma(baseColor).darken(2).hex(),
    "--color-primary-600": chroma(baseColor).darken(3).hex(),
    "--color-primary-700": chroma(baseColor).darken(4).hex()
  };
};

function useThemeProvider(): ThemeContextState {
  const [theme, setTheme] = useState<Theme>("blue");
  const [customColor, setCustomColor] = useState<string>();
  const [cafecitoVariant, setCafecitoVariant] = useState<CafecitoVariant>(6);

  const handleChangeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setCafecitoVariant(CAFECITO_VARIANTS[newTheme]);

    if (newTheme !== "custom") {
      const customThemeElement =
        document.querySelector<HTMLElement>(".theme-custom");

      if (customThemeElement) {
        customThemeElement.setAttribute("style", "");
      }
    } else {
      setCustomColor("#5463e6");
    }
  }, []);

  const debouncedSetCustomColor = useDebouncedCallback((newColor: string) => {
    setCustomColor(newColor);
    localStorage.setItem("customColor", newColor);
  }, 500);

  const handleChangeCustomColor = useCallback(
    (newColor: string) => {
      debouncedSetCustomColor(newColor);
      const palette = generatePalette(newColor);

      const customThemeElement =
        document.querySelector<HTMLElement>(".theme-custom");

      if (customThemeElement) {
        Object.entries(palette).forEach(([key, value]) => {
          customThemeElement.style.setProperty(key, value);
        });
      }
    },
    [debouncedSetCustomColor]
  );

  const clear = () => {
    handleChangeTheme("blue");
    localStorage.removeItem("customColor");
    localStorage.removeItem("theme");
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | undefined;

    if (storedTheme === "custom") {
      const storedCustomColor = localStorage.getItem("customColor");
      if (storedCustomColor) {
        handleChangeCustomColor(storedCustomColor);
      }
    }

    if (storedTheme) {
      setTheme(storedTheme);
      setCafecitoVariant(CAFECITO_VARIANTS[storedTheme]);
    }
  }, []);

  return {
    theme,
    customColor,
    cafecitoVariant,
    clear,
    changeTheme: handleChangeTheme,
    changeCustomColor: handleChangeCustomColor
  };
}
