import React from "react";

import {SelectProps} from "./types";
import {
  Field,
  Label,
  Select as HeadLessSelect,
  Description
} from "@headlessui/react";

export const Select = ({
  label,
  description,
  className,
  descriptionClassName,
  containerClassName,
  labelColor = "text-white",
  ...rest
}: SelectProps) => {
  return (
    <Field className={containerClassName}>
      {label && (
        <Label className={`text-lg font-medium ${labelColor}`}>{label}</Label>
      )}
      <HeadLessSelect
        className={`mt-3 block w-full rounded-lg border dark:border-white/60 bg-primary-50 dark:bg-primary-700 py-1.5 px-6 text-base text-gray-500 dark:text-white ${className}`}
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
