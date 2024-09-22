import {InputHTMLAttributes} from "react";

export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  descriptionClassName?: string;
  labelColor?: string;
  containerClassName?: string;
}
