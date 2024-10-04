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
      <div className="relative">
        <HeadLessSelect
          className={`cursor-pointer mt-1.5 md:mt-3 block w-full rounded-lg border dark:border-white/60 bg-primary-50 dark:bg-primary-700 py-1.5 px-6 text-base text-gray-500 dark:text-white appearance-none ${className}`}
          {...rest}
        />
        <svg
          className="pointer-events-none absolute top-3 right-3 md:top-4 md:right-5 size-3 md:size-4 transition-all"
          width="16"
          height="10"
          viewBox="0 0 16 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1.5L8 8.5L15 1.5"
            stroke="#6B6B6B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
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
