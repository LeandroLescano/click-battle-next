import {InputHTMLAttributes} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  descriptionClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
}
