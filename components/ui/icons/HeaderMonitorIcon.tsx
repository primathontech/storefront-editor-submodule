import React from "react";

interface HeaderMonitorIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Header monitor icon (width: 30px, height: 30px)
 * Source: Figma node 2317:6777
 */
export const HeaderMonitorIcon: React.FC<HeaderMonitorIconProps> = ({
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
      {/* Monitor screen - scaled up to fill more space */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.90476 5C5.85279 5 5 5.93274 5 7.08332V18.4166C5 19.5672 5.85279 20.4999 6.90476 20.4999H11.6217L10.8598 22.1666H9.19048C8.9801 22.1666 8.80952 22.3532 8.80952 22.5833C8.80952 22.8134 8.9801 22.9999 9.19048 22.9999H11.087C11.0923 23 11.0976 23 11.1029 22.9999H18.8971C18.9024 23 18.9077 23 18.913 22.9999H20.8095C21.0199 22.9999 21.1905 22.8134 21.1905 22.5833C21.1905 22.3532 21.0199 22.1666 20.8095 22.1666H19.1402L18.3783 20.4999H23.0952C24.1472 20.4999 25 19.5672 25 18.4166V7.08332C25 5.93274 24.1472 5 23.0952 5H6.90476ZM16.2884 22.1666L15.5265 20.4999H14.4735L13.7116 22.1666H16.2884ZM15.7536 19.6666C15.7589 19.6665 15.7643 19.6665 15.7696 19.6666H23.0952C23.7264 19.6666 24.2381 19.107 24.2381 18.4166V7.08332C24.2381 6.39297 23.7264 5.83333 23.0952 5.83333H6.90476C6.27358 5.83333 5.7619 6.39297 5.7619 7.08332V18.4166C5.7619 19.107 6.27358 19.6666 6.90476 19.6666H14.2304C14.2357 19.6665 14.2411 19.6665 14.2463 19.6666H15.7536Z"
        fill="currentColor"
      />
    </svg>
  );
};
