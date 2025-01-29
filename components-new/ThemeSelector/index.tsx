import React, {useEffect, useRef, useState} from "react";
import {Input} from "@headlessui/react";

import {useAuth} from "contexts/AuthContext";
import {Theme, THEMES, useTheme} from "contexts/ThemeContext";
import {stopPropagation} from "utils/events";

export const ThemeSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {changeCustomColor, changeTheme, theme, customColor} = useTheme();
  const {user} = useAuth();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOnChange = (theme: Theme) => {
    changeTheme(theme);
    setIsOpen(false);
  };

  const handleOnChangeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeCustomColor(e.target.value);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="relative inline-block self-stretch md:self-center flex-1"
      ref={dropdownRef}
    >
      <button
        type="button"
        className="language-menu inline-flex justify-between gap-1 md:gap-3 items-center w-full h-9 md:h-12 rounded-md shadow-sm uppercase text-xs md:text-2xl leading-none font-bold bg-white dark:bg-primary-400 dark:text-white"
        id="language-menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={toggleDropdown}
      >
        {theme === "custom" && (
          <Input
            type="color"
            className="size-4 md:size-6 rounded cursor-pointer"
            defaultValue={customColor}
            onClick={stopPropagation}
            onChange={handleOnChangeColor}
          />
        )}
        {theme}
        <img
          src="/icons/chevron-down.svg"
          alt="chevron-down"
          className="w-3 h-3 md:w-6 md:h-6 object-cover dark:invert"
        />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          <div className="py-1" role="none">
            {THEMES.map((themeData) => {
              if (themeData.requiresLogin && user?.isAnonymous) {
                return null;
              }

              return (
                <button
                  key={themeData.theme}
                  className={`${
                    theme === themeData.theme
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700"
                  } group flex items-center w-full px-4 py-2 text-base hover:bg-gray-100 hover:text-gray-900`}
                  role="menuitem"
                  onClick={() => handleOnChange(themeData.theme)}
                >
                  {themeData.theme}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
