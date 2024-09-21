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
  ...rest
}: InputProps) => {
  return (
    <Field>
      {label && (
        <Label className="text-lg font-medium text-white">{label}</Label>
      )}
      <HeadLessInput
        className={`mt-3 block w-full rounded-lg border border-white/60 bg-primary-700 py-1.5 px-6 text-base text-white ${className}`}
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
