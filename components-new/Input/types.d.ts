import {InputHTMLAttributes} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  descriptionClassName?: string;
  labelClassname?: string;
  containerClassName?: string;
}
