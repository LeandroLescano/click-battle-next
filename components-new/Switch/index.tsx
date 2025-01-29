import React from "react";
import {Field, Label, Switch as HeadLessSwitch} from "@headlessui/react";
import {twMerge} from "tailwind-merge";
import {useTranslation} from "react-i18next";

import {SwitchProps} from "./types";

export const Switch = ({
  label,
  className,
  labelClassName,
  containerClassName,
  ...rest
}: SwitchProps) => {
  const {t} = useTranslation();

  return (
    <Field className={containerClassName}>
      {label && (
        <Label
          onClick={() => rest.onChange?.(!rest.checked)}
          className={twMerge(
            "text-lg font-medium text-white cursor-pointer",
            labelClassName
          )}
        >
          {label}
        </Label>
      )}
      <HeadLessSwitch
        className={`group relative flex h-7 w-14 cursor-pointer rounded-full bg-white/10 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white data-[checked]:bg-primary-400 ${className}`}
        {...rest}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7 relative"
        ></span>
        <span className="top-0.5 absolute right-2 group-data-[checked]:left-2 group-data-[checked]:right-auto transition duration-200 ease-in-out text-white">
          {rest.checked ? t("Yes") : t("No")}
        </span>
      </HeadLessSwitch>
    </Field>
  );
};
