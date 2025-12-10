"use client";

import * as React from "react";
import { useTheme } from "@/ui/theme";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right";
  color?: "default" | "primary" | "secondary" | "accent" | "light" | "lighter";
  truncate?: boolean;
  lineClamp?: number;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      as: Component = "h2",
      className = "",
      size,
      weight = "bold",
      align = "left",
      color = "default",
      truncate = false,
      lineClamp,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const { activeTheme, previewTheme } = useTheme();
    const currentTheme = previewTheme || activeTheme;

    const themeStyles = React.useMemo(() => {
      if (!currentTheme?.config) {
        return {};
      }

      const { colors, typography } = currentTheme.config;
      const styles: React.CSSProperties = {
        fontFamily:
          typography?.headingFont || typography?.bodyFont || "sans-serif",
        lineHeight: typography?.["line-height-tight"] || "1.2",
        letterSpacing: typography?.["letter-spacing-tight"] || "-0.025em",
        textAlign: align,
        marginTop: "0",
      };

      const defaultSizes: Record<string, string> = {
        h1: typography?.["font-size-5xl"] || "3.75rem",
        h2: typography?.["font-size-4xl"] || "3rem",
        h3: typography?.["font-size-3xl"] || "2.25rem",
        h4: typography?.["font-size-2xl"] || "1.875rem",
        h5: typography?.["font-size-xl"] || "1.5rem",
        h6: typography?.["font-size-lg"] || "1.25rem",
      };

      const sizeMap: Record<string, string | undefined> = {
        "2xl": typography?.["font-size-2xl"],
        "3xl": typography?.["font-size-3xl"],
        "4xl": typography?.["font-size-4xl"],
        "5xl": typography?.["font-size-5xl"],
        "6xl": "4.5rem",
        "7xl": "5rem",
        "8xl": "6rem",
        "9xl": "8rem",
      };

      styles.fontSize =
        size && sizeMap[size]
          ? sizeMap[size]
          : defaultSizes[Component] ||
            typography?.["font-size-2xl"] ||
            "1.875rem";

      const weightMap: Record<string, string | undefined> = {
        normal: typography?.["font-weight-normal"],
        medium: typography?.["font-weight-medium"],
        semibold: typography?.["font-weight-semibold"],
        bold: typography?.["font-weight-bold"],
      };

      styles.fontWeight =
        weightMap[weight] || typography?.["font-weight-bold"] || "700";

      const colorMap: Record<string, string> = {
        default: colors?.text || "#000000",
        primary: colors?.primary || "#3b82f6",
        secondary: colors?.secondary || "#6c757d",
        accent: colors?.accent || colors?.primary || "#3b82f6",
        light: colors?.["text-light"] || colors?.text || "#4a5568",
        lighter: colors?.["text-lighter"] || colors?.text || "#718096",
      };

      styles.color = colorMap[color] || colors?.text || "#000000";

      if (truncate) {
        styles.overflow = "hidden";
        styles.textOverflow = "ellipsis";
        styles.whiteSpace = "nowrap";
      }

      if (lineClamp) {
        styles.overflow = "hidden";
        styles.display = "-webkit-box";
        styles.WebkitLineClamp = lineClamp;
        styles.WebkitBoxOrient = "vertical";
      }

      return styles;
    }, [
      currentTheme,
      Component,
      size,
      weight,
      color,
      align,
      truncate,
      lineClamp,
    ]);

    const combinedClassName = ["theme-heading", className]
      .filter(Boolean)
      .join(" ");

    return (
      <Component
        ref={ref}
        className={combinedClassName}
        style={{ ...themeStyles, ...style }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = "Heading";
