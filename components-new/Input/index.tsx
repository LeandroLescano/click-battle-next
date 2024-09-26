import React from "react";

import {InputProps} from "./types";
import {
  Field,
  Label,
  Input as HeadLessInput,
  Description
} from "@headlessui/react";

export const Input = ({
  label,
  description,
  className,
  descriptionClassName,
  labelColor = "text-white",
  containerClassName,
  ...rest
}: InputProps) => {
  return (
    <Field className={containerClassName}>
      {label && (
        <Label className={`text-lg font-medium ${labelColor}`}>{label}</Label>
      )}
      <HeadLessInput
        className={`mt-3 block w-full rounded-lg border dark:border-white/60 bg-primary-50 dark:bg-primary-700 py-1.5 px-6 text-base text-slate-500 dark:text-white ${className}`}
        {...rest}
      />
      {description && (
        <Description
          className={`text-start text-sm mt-4 ${descriptionClassName}`}
        >
          {description}
        </Description>
      )}
    </Field>
  );
};
