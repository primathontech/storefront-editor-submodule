import React from "react";
import { Input as DesignInput } from "./design-system";
import styles from "./ImageInput.module.css";

export interface ImageInputProps {
  value: { src: string; alt: string };
  onChange: (value: { src: string; alt: string }) => void;
  label?: string;
  disabled?: boolean;
}

export const ImageInput: React.FC<ImageInputProps> = ({
  value,
  onChange,
  label,
  disabled,
}) => (
  <div className={styles.root}>
    {label && <span className={styles.label}>{label}</span>}

    <div className={styles.fields}>
      <DesignInput
        label="Image URL"
        labelVariant="subtle"
        type="text"
        size="md"
        value={value.src}
        onChange={(e) => onChange({ ...value, src: e.target.value })}
        disabled={disabled}
        placeholder="Image URL"
        fullWidth
      />
      <DesignInput
        label="Alt text"
        labelVariant="subtle"
        type="text"
        size="md"
        value={value.alt}
        onChange={(e) => onChange({ ...value, alt: e.target.value })}
        disabled={disabled}
        placeholder="Alt text"
        fullWidth
      />
    </div>
  </div>
);
