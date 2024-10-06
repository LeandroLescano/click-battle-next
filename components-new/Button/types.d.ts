import {ButtonHTMLAttributes} from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outlined" | "card";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  onClick?: VoidFunction;
  className?: string;
}
