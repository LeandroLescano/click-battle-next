import {clsx} from "clsx";
import Link from "next/link";
import type {ComponentProps} from "react";

import type {ButtonProps} from "./types";

import "./styles.scss";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonProps["variant"];
};

// Navigation keeps native link semantics and the existing button palette/motion.
export const ButtonLink = ({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) => (
  <Link className={clsx("button", `button-${variant}`, className)} {...props} />
);
