import React from "react";
import {useTranslation} from "react-i18next";

import {Button, LanguageDropdown} from "components-new";
import {useAuth} from "contexts/AuthContext";
import {ThemeSelector} from "components-new/ThemeSelector";

export const Header = () => {
  const {signOut} = useAuth();
  const {t} = useTranslation();

  return (
    <header className="flex justify-between items-center">
      <h1 className="text-3xl md:text-7xl drop-shadow-sm font-tiny5 [text-shadow:2px_0px_0px_var(--color-primary-400)] md:[text-shadow:5px_0px_0px_var(--color-primary-400)]">
        Click Battle!
      </h1>
      <div className="flex items-center gap-1 md:gap-9 flex-col-reverse md:flex-row">
        <ThemeSelector />
        <LanguageDropdown />
        <Button
          onClick={signOut}
          variant="outlined"
          className="px-4 py-0.5 uppercase text-xs md:text-2xl md:min-w-36 w-full md:w-fit"
        >
          {t("Log out")}
        </Button>
      </div>
    </header>
  );
};
