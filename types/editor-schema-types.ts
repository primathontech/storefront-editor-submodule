/**
 * Editor Schema Types
 *
 * These types are specific to the visual editor and define the schema
 * structure used to generate form fields in the editor sidebar.
 * These are NOT used by the runtime page-building engine.
 */

/**
 * Schema definition for sections - used by the editor to generate forms
 */
export interface SectionSchema {
  /** Section type identifier */
  type: string;

  /** Display name for the editor */
  name: string;

  /** Description for the editor */
  description?: string;

  /** Settings schema for the section (editor-only, shape matches DynamicForm) */
  settingsSchema: Record<
    string,
    {
      type:
        | "text"
        | "number"
        | "boolean"
        | "select"
        | "spacing"
        | "image"
        | "faq"
        | "richtext"
        | "html"
        | "objectArray"
        | "array";
      label?: string;
      default?: any;
      options?: Array<{ value: any; label: string }>;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
      optional?: boolean;
      fields?: string[];
      placeholder?: string;
    }
  >;
}

/**
 * Registry types for the editor
 */
export interface SectionRegistry {
  [key: string]: SectionSchema;
}
