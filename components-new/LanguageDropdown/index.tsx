import React, {useEffect, useRef, useState} from "react";
import {changeLanguage} from "i18next";
import {useTranslation} from "react-i18next";

import {languages} from "i18n/settings";

import "./styles.scss";

export const LanguageDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {i18n} = useTranslation();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOnChange = (lang: string) => {
    changeLanguage(lang);
    setIsOpen(false);
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
      className="relative inline-block md:min-w-28 self-stretch"
      ref={dropdownRef}
    >
      <button
        type="button"
        className="language-menu inline-flex justify-between items-center w-full h-full rounded-md shadow-sm uppercase text-xs md:text-2xl leading-none font-bold bg-white dark:bg-primary-400 dark:text-white"
        id="language-menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={toggleDropdown}
      >
        <span className="flex items-center gap-3">
          <img
            src={`/flags/${i18n.language}.svg`}
            alt={`${i18n.language} flag`}
            className="flag-img"
          />
          {i18n.language}
          <img
            src="/icons/chevron-down.svg"
            alt="chevron-down"
            className="w-3 h-3 md:w-6 md:h-6 object-cover dark:invert"
          />
        </span>
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          <div className="py-1" role="none">
            {languages.map((language) => (
              <button
                key={language}
                className={`${
                  i18n.language === language
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700"
                } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900`}
                role="menuitem"
                onClick={() => handleOnChange(language)}
              >
                <img
                  src={`/flags/${language}.svg`}
                  alt={`${language} flag`}
                  className="w-5 h-4 mr-3 object-cover"
                />
                {language}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
