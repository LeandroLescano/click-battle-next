import React from "react";
import {useTranslation} from "react-i18next";

import {ButtonProps} from "./types";
import "./styles.scss";

export const Button = ({
  variant = "primary",
  children,
  className,
  loading,
  loadingText,
  onClick = () => {},
  ...rest
}: ButtonProps) => {
  const {t} = useTranslation();

  return (
    <button
      className={`button button-${variant} ${className || ""}`}
      onClick={onClick}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading ? (
        <span className="leading-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            className="inline w-5 h-5 me-3 text-gray-200 animate-spin dark:text-gray-600"
          >
            <path
              fill="currentColor"
              d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
            />
          </svg>
          {t(loadingText || "Loading...")}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
