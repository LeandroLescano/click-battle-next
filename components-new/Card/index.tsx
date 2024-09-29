import React from "react";

import {CardProps} from "./types";
import "./styles.scss";

export const Card = ({children, className}: CardProps) => {
  return <div className={`card ${className || ""}`}>{children}</div>;
};
