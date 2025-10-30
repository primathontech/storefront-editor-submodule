import React from "react";

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
  <div style={{ marginBottom: "1rem" }}>
    {label && <label style={{ fontWeight: 500 }}>{label}</label>}
    <input
      type="text"
      placeholder="Image URL"
      value={value.src}
      disabled={disabled}
      onChange={(e) => onChange({ ...value, src: e.target.value })}
      style={{ width: "100%", marginBottom: 4 }}
    />
    <input
      type="text"
      placeholder="Alt text"
      value={value.alt}
      disabled={disabled}
      onChange={(e) => onChange({ ...value, alt: e.target.value })}
      style={{ width: "100%" }}
    />
    {/* Future: Add upload button here */}
  </div>
);
