import {InputHTMLAttributes} from "react";
import {ClassNameValue} from "tailwind-merge";

export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  descriptionClassName?: string;
  labelClassName?: ClassNameValue;
  containerClassName?: string;
}
