import React from "react";

interface HeaderTabletIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Header tablet icon (width: 28px, height: 28px)
 * Simple tablet glyph to sit between desktop and mobile icons.
 */
export const HeaderTabletIcon: React.FC<HeaderTabletIconProps> = ({
  className,
  style,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill="none"
    >
      <rect
        x="0.25"
        y="0.25"
        width="10.5"
        height="13.5"
        rx="0.75"
        fill="#F4F6F9"
        stroke="#999999"
        strokeWidth="0.5"
      />
      <rect x="11" y="2" width="0.2" height="2" rx="0.1" fill="#999999" />
    </svg>
  );
};
