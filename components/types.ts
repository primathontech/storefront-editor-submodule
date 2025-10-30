/**
 * Common types for UI components
 */

export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl";

export type ComponentVariants =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "ghost"
  | "outline"
  | "link";

export interface BaseComponentProps {
  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Component size
   */
  size?: ComponentSize;

  /**
   * Component variant
   */
  variant?: ComponentVariants;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Accessibility label
   */
  "aria-label"?: string;

  /**
   * Test ID for testing
   */
  "data-testid"?: string;
}

export interface ThemeableComponentProps extends BaseComponentProps {
  /**
   * Override theme colors
   */
  color?: string;

  /**
   * Override background color
   */
  backgroundColor?: string;

  /**
   * Override border color
   */
  borderColor?: string;
}

/**
 * Polymorphic component props
 */
export type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = {},
> = Props & {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof Props | "as">;

/**
 * Extract props type from a component
 */
export type PropsOf<
  C extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>,
> = JSX.LibraryManagedAttributes<C, React.ComponentPropsWithoutRef<C>>;
