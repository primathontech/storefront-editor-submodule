import React from "react";

interface HeaderMobileIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Header mobile icon (width: 28px, height: 28px)
 * Source: Figma node 2317:6777
 */
export const HeaderMobileIcon: React.FC<HeaderMobileIconProps> = ({
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
      {/* Outer phone body */}
      <rect
        x="9"
        y="4"
        width="10"
        height="20"
        rx="2.5"
        fill="transparent"
        stroke="currentColor"
      />
      {/* Screen area */}
      <rect
        x="10.2"
        y="6"
        width="7.6"
        height="14"
        rx="1.5"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Top notch / speaker */}
      <rect
        x="11.5"
        y="5"
        width="5"
        height="1.2"
        rx="0.6"
        fill="currentColor"
      />
      {/* Home indicator */}
      <rect
        x="12.5"
        y="22.5"
        width="3"
        height="1"
        rx="0.5"
        fill="currentColor"
      />
    </svg>
  );
};
