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
      {/* Outer phone body - scaled up to fill more space */}
      <rect
        x="7"
        y="3"
        width="14"
        height="22"
        rx="3"
        fill="transparent"
        stroke="currentColor"
      />
      {/* Screen area */}
      <rect
        x="8"
        y="5"
        width="12"
        height="16"
        rx="1.5"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Top notch / speaker */}
      <rect
        x="9.5"
        y="4"
        width="8"
        height="1.5"
        rx="0.75"
        fill="currentColor"
      />
      {/* Home indicator */}
      <rect x="11" y="23" width="6" height="1.2" rx="0.6" fill="currentColor" />
    </svg>
  );
};
