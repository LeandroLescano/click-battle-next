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
      width="107"
      height="119"
      viewBox="0 0 107 119"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="26.8887"
        y="66.1111"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="13.6665"
        y="79.3334"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="0.444336"
        y="92.5555"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="26.8887"
        y="79.3334"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="13.6665"
        y="92.5555"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="0.444336"
        y="105.778"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="40.1111"
        y="66.1111"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="53.3333"
        y="66.1111"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="40.1111"
        y="52.8889"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="26.8887"
        y="39.6666"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="13.6665"
        y="26.4445"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="0.444336"
        y="13.2222"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="40.1111"
        y="39.6666"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="26.8887"
        y="26.4445"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="13.6665"
        y="13.2222"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="0.444336"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="53.3333"
        y="39.6666"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="66.5554"
        y="26.4445"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="79.7776"
        y="13.2222"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="93"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="53.3333"
        y="52.8889"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="66.5554"
        y="66.1111"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="79.7776"
        y="79.3334"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="93"
        y="92.5555"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="66.5554"
        y="79.3334"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="79.7776"
        y="92.5555"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="93"
        y="105.778"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="66.5554"
        y="39.6666"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="79.7776"
        y="26.4445"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
      <rect
        x="93"
        y="13.2222"
        width="13.2222"
        height="13.2222"
        fill="var(--color-primary-300)"
      />
    </svg>
  );
};
