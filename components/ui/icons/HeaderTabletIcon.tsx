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
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      style={{ width: "28px", height: "28px", aspectRatio: "1/1", ...style }}
      {...props}
    >
      {/* Outer tablet body - horizontal (landscape) */}
      <rect
        x="4"
        y="9"
        width="20"
        height="10"
        rx="2.5"
        fill="transparent"
        stroke="currentColor"
      />
      {/* Screen area */}
      <rect
        x="6"
        y="10.5"
        width="16"
        height="7"
        rx="1.5"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Side button / indicator */}
      <rect x="5" y="13" width="1" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
};
