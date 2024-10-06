import React from "react";

interface CrossProps {
  onClick?: () => void;
  className?: string;
}

export const Cross = ({className, onClick = () => {}}: CrossProps) => {
  return (
    <svg
      onClick={onClick}
      className={`cursor-pointer ${className}`}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M30 10L10 30"
        stroke="var(--color-primary-300)"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10L30 30"
        stroke="var(--color-primary-300)"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
