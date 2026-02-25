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
      viewBox="0 0 30 30"
      fill="none"
      className={className}
      style={{ width: "30px", height: "30px", aspectRatio: "1/1", ...style }}
      {...props}
    >
      {/* Main screen rect - scaled up to fill more space */}
      <rect
        x="6"
        y="3"
        width="18"
        height="24"
        rx="2"
        fill="#F4F6F9"
        stroke="#999999"
      />
      {/* Center divider line */}
      <rect width="18" height="4" x="6" y="13" fill="#F4F6F9" />
      {/* Left arrow path - scaled and repositioned */}
      <path
        d="M7.26874 14.8132L9.0051 13.0768C9.0547 13.0272 9.1207 13 9.1912 13C9.2617 13 9.3277 13.0272 9.3773 13.0768L9.5349 13.2345C9.5845 13.2839 9.6118 13.3501 9.6118 13.4205C9.6118 13.491 9.5845 13.5593 9.5349 13.6088L8.522 14.624H11.7402C11.8853 14.624 12 14.7376 12 14.8827V15.1057C12 15.2508 11.8853 15.3759 11.7402 15.3759H8.5105L9.5349 16.3967C9.5844 16.4463 9.6117 16.5106 9.6117 16.5811C9.6117 16.6515 9.5844 16.7167 9.5349 16.7662L9.3773 16.9234C9.3277 16.973 9.2617 17 9.1911 17C9.1207 17 9.0546 16.9726 9.0051 16.9231L7.2687 15.1867C7.21902 15.137 7.1917 15.0706 7.19189 15C7.19174 14.9292 7.21902 14.8628 7.26874 14.8132Z"
        fill="#999999"
      />
      {/* Right arrow path - scaled and repositioned */}
      <path
        d="M22.7313 14.8132L20.9949 13.0768C20.9453 13.0272 20.8793 13 20.8088 13C20.7383 13 20.6723 13.0272 20.6227 13.0768L20.4651 13.2345C20.4155 13.2839 20.3882 13.3501 20.3882 13.4205C20.3882 13.491 20.4155 13.5593 20.4651 13.6088L21.478 14.624H18.2598C18.1147 14.624 18 14.7376 18 14.8827V15.1057C18 15.2508 18.1147 15.3759 18.2598 15.3759H21.4895L20.4651 16.3967C20.4156 16.4463 20.3883 16.5106 20.3883 16.5811C20.3883 16.6515 20.4156 16.7167 20.4651 16.7662L20.6227 16.9234C20.6723 16.973 20.7383 17 20.8089 17C20.8793 17 20.9454 16.9726 20.9949 16.9231L22.7313 15.1867C22.781 15.137 22.8083 15.0706 22.8081 15C22.8083 14.9292 22.781 14.8628 22.7313 14.8132Z"
        fill="#999999"
      />
    </svg>
  );
};
