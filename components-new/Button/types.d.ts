import {ButtonHTMLAttributes} from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outlined";
  loading?: boolean;
  children: React.ReactNode;
  onClick: VoidFunction;
  className?: string;
}
