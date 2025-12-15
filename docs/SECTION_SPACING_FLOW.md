## Section spacing & layout flow (short version)

### 1. Runtime model (source of truth)

- `SectionConfig.settings` (`src/lib/page-builder/models/page-config-types.ts`):
  - `layout: "page" | "full"`.
  - `responsive?: { mobile | tablet | desktop: { padding: Spacing; margin?: Spacing } }`.
  - Base `padding` / `margin` exist only as a fallback when `responsive` is missing.
- Templates (e.g. `themes/wellversed/templates/home/default.ts`) set `settings.responsive` directly for most sections.

### 2. How spacing is applied

- `createPageBuildingEngine` wires `SectionWrapper` around each section.
- `SectionWrapper` (`src/ui/layout/SectionWrapper.tsx`):
  - Picks a breakpoint from `window.innerWidth`.
  - Uses `section.settings.responsive[currentBreakpoint]` if present.
  - Falls back to base `padding` / `margin` otherwise.
  - For `HEADER_SECTION`, returns `children` directly (no container spacing/layout).

### 3. How the editor edits spacing

- **Schema** (`src/cms/schemas/section-registry.ts`):
  - Non‑header sections expose:
    - `responsive: { type: "spacing", label: "Section spacing", default: {} }`.
  - Header section does **not** expose container spacing (matches `SectionWrapper` behavior).
- **Form** (`DynamicForm`):
  - `type: "spacing"` → `ResponsiveSpacingInput` (mobile/tablet/desktop, padding + margin).
  - Changes call `onUpdate("responsive", value)`.
- **State update** (`BuilderToolbar` + `useEditorState`):
  - `handleSectionSettingChange("responsive", value)` → `updateSection` → writes `settings.responsive = value`.

So the flow is:

> **Editor field `settingsSchema.responsive` → `DynamicForm` → `settings.responsive` → `SectionWrapper`.**

This doc is only about **section container spacing**; widget‑level layout stays per‑widget and is not covered here.
