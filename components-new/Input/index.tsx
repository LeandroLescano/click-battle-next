import React from "react";
import {
  Field,
  Label,
  Input as HeadLessInput,
  Description
} from "@headlessui/react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";

import {InputProps} from "./types";

export const Input = ({
  label,
  description,
  className,
  descriptionClassName,
  labelClassname,
  containerClassName,
  ...rest
}: InputProps) => {
  return (
    <Field className={containerClassName}>
      {label && (
        <Label
          className={twMerge("text-lg font-medium text-white", labelClassname)}
        >
          {label}
        </Label>
      )}
      <HeadLessInput
        className={`mt-1.5 md:mt-3 block w-full rounded-lg border dark:border-white/60 bg-primary-50 dark:bg-primary-700 py-1.5 px-3 md:px-6 text-base text-slate-500 dark:text-white ${className}`}
        {...rest}
      />
      {description && (
        <Description
          className={twMerge(
            clsx("text-start text-sm mt-4", descriptionClassName)
          )}
        >
          {description}
        </Description>
      )}
    </Field>
  );
};
