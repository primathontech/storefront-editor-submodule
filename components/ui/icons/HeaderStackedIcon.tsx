import React from "react";

interface HeaderStackedIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Header fullscreen icon
 * Uses provided SVG, sized to fit the 30x30 header pill slot.
 */
export const HeaderStackedIcon: React.FC<HeaderStackedIconProps> = ({
  className,
  style,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ width: "30px", height: "30px", aspectRatio: "1/1", ...style }}
      {...props}
    >
      {/* Scale the path down slightly so the filled corners look visually thinner */}
      <g transform="translate(1.8 1.8) scale(0.85)">
        <path
          d="M21 3v6h-2V6.41l-3.29 3.3-1.42-1.42L17.59 5H15V3zM3 3v6h2V6.41l3.29 3.3 1.42-1.42L6.41 5H9V3zm18 18v-6h-2v2.59l-3.29-3.29-1.41 1.41L17.59 19H15v2zM9 21v-2H6.41l3.29-3.29-1.41-1.42L5 17.59V15H3v6z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
