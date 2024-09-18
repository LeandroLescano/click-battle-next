import React from "react";

import {ButtonProps} from "./types";
import "./styles.scss";

export const Button = ({
  variant = "primary",
  children,
  className,
  onClick
}: ButtonProps) => {
  return (
    <button
      className={`button button-${variant} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
