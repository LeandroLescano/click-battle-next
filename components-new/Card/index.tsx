import React from "react";
import clsx from "clsx";
import {twMerge} from "tailwind-merge";

import {CardProps} from "./types";
import "./styles.scss";

export const Card = ({children, className}: CardProps) => {
  return (
    <div
      className={twMerge(
        clsx(
          "card",
          "border-2 rounded-md bg-primary-100 border-primary-300",
          className
        )
      )}
    >
      {children}
    </div>
  );
};
