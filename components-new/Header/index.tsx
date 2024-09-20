import React from "react";
import {useTranslation} from "react-i18next";

import {Button, LanguageDropdown} from "components-new";
import {useAuth} from "contexts/AuthContext";

export const Header = () => {
  const {signOut} = useAuth();
  const {t} = useTranslation();

  return (
    <header className="flex justify-between items-center">
      <h1 className="text-7xl drop-shadow-sm font-tiny5 [text-shadow:5px_0px_0px_var(--color-primary-400)]">
        Click Battle!
      </h1>
      <div className="flex items-center gap-9">
        <LanguageDropdown />
        <Button
          onClick={signOut}
          variant="outlined"
          className="px-5 py-1 uppercase text-2xl min-w-36"
        >
          {t("Log out")}
        </Button>
      </div>
    </header>
  );
};
