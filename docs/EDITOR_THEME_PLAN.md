# Editor Theme Isolation Plan

## Current State Analysis

### Problem

1. **Merchant theme CSS variables** (`--color-*`, `--font-*`, etc.) are applied globally to `:root` via `ThemeProvider`
2. **Tailwind utilities** (`bg-background`, `text-text`, `font-heading`, etc.) read from these merchant CSS vars
3. **`globals.css` base styles** apply theme-bound utilities globally:
   - `body { @apply bg-background text-text font-body }`
   - `h1-h6 { @apply font-heading }`
4. **Editor components** mostly use hardcoded Tailwind classes (`bg-white`, `text-gray-900`), BUT:
   - Base HTML elements (body, headings) still inherit merchant theme
   - Any accidental use of theme-bound utilities would break
   - Current reset in `layout.tsx` is a band-aid (overwrites `:root` vars)

### Current Editor Component Usage

- ✅ **Good**: Most components use hardcoded classes (`bg-white`, `text-gray-900`, `border-gray-200`)
- ⚠️ **Risk**: Base HTML elements inherit merchant theme via `globals.css`
- ⚠️ **Risk**: No clear separation - easy to accidentally use theme-bound utilities

---

## Solution: Editor-Specific Theme System (Approach A)

### Core Concept

Create a **separate editor theme** using CSS variables with `editor-*` prefix, mapped to Tailwind utilities. Use `data-editor-theme` attribute for multi-theme support.

### Architecture

#### 1. Editor Theme Tokens (CSS Variables)

Define semantic editor tokens that are **independent** of merchant theme:

```css
/* Default editor theme (dark) */
:root {
  --editor-bg: #020617;
  --editor-surface: #020617;
  --editor-surface-muted: #0f172a;
  --editor-border: #1f2937;
  --editor-accent: #3b82f6;
  --editor-text: #e5e7eb;
  --editor-text-muted: #9ca3af;
  --editor-text-subtle: #6b7280;
}

/* Light theme */
[data-editor-theme="light"] {
  --editor-bg: #f9fafb;
  --editor-surface: #ffffff;
  --editor-surface-muted: #f3f4f6;
  --editor-border: #e5e7eb;
  --editor-accent: #2563eb;
  --editor-text: #0f172a;
  --editor-text-muted: #6b7280;
  --editor-text-subtle: #9ca3af;
}
```

#### 2. Tailwind Config Extension

Add `editor-*` color utilities that map to CSS variables:

```ts
// tailwind.config.ts
extend: {
  colors: {
    "editor-bg": "var(--editor-bg)",
    "editor-surface": "var(--editor-surface)",
    "editor-surface-muted": "var(--editor-surface-muted)",
    "editor-border": "var(--editor-border)",
    "editor-accent": "var(--editor-accent)",
    "editor-text": "var(--editor-text)",
    "editor-text-muted": "var(--editor-text-muted)",
    "editor-text-subtle": "var(--editor-text-subtle)",
  },
}
```

#### 3. Editor Layout Wrapper

Wrap editor route with `data-editor-theme` attribute:

```tsx
// src/app/editor/[id]/layout.tsx
export default function EditorLayout({ children }) {
  return (
    <div data-editor-theme="dark">
      {" "}
      {/* or "light" */}
      {children}
    </div>
  );
}
```

#### 4. Editor Theme CSS File (Isolated)

Create `src/app/editor/editor-theme.css` with all editor theme code:

```css
/* Editor theme CSS variables - isolated from merchant themes */
:root {
  --editor-bg: #020617;
  --editor-surface: #020617;
  --editor-surface-muted: #0f172a;
  --editor-border: #1f2937;
  --editor-accent: #3b82f6;
  --editor-text: #e5e7eb;
  --editor-text-muted: #9ca3af;
  --editor-text-subtle: #6b7280;
}

/* Light theme variant */
[data-editor-theme="light"] {
  --editor-bg: #f9fafb;
  --editor-surface: #ffffff;
  --editor-surface-muted: #f3f4f6;
  --editor-border: #e5e7eb;
  --editor-accent: #2563eb;
  --editor-text: #0f172a;
  --editor-text-muted: #6b7280;
  --editor-text-subtle: #9ca3af;
}

/* Override globals.css base styles for editor route only */
[data-editor-theme] body {
  background-color: var(--editor-bg);
  color: var(--editor-text);
  font-family:
    system-ui,
    -apple-system,
    sans-serif; /* Not theme-bound */
}

[data-editor-theme] h1,
[data-editor-theme] h2,
[data-editor-theme] h3,
[data-editor-theme] h4,
[data-editor-theme] h5,
[data-editor-theme] h6 {
  font-family:
    system-ui,
    -apple-system,
    sans-serif; /* Not theme-bound */
  color: var(--editor-text);
}
```

---

## Implementation Steps

### Phase 1: Setup Editor Theme Infrastructure

1. **Create `src/app/editor/editor-theme.css`** (NEW FILE)
   - Define `--editor-*` CSS variables with default (dark) theme
   - Add `[data-editor-theme="light"]` variant
   - Add editor-scoped base style overrides for `body`, `h1-h6`
   - **All editor theme code in one place, isolated from merchant code**

2. **Extend Tailwind config** (minimal global change)
   - Add `editor-*` color utilities mapping to CSS vars
   - **Alternative**: Skip Tailwind utilities, use CSS classes directly (fully isolated)

3. **Update editor layout**
   - Remove current `:root` reset hack
   - Import `editor-theme.css`
   - Add `data-editor-theme="dark"` wrapper div

### Phase 2: Migrate Editor Components (Gradual)

1. **Audit all editor components** (`src/app/editor/**`)
   - Find any usage of theme-bound utilities:
     - `bg-background`, `text-text`, `font-heading`, `font-body`
     - `text-primary`, `bg-surface`, etc.
   - Replace with `editor-*` utilities or keep hardcoded classes

2. **Priority components to migrate:**
   - `EditorHeader2.tsx` - Header bar
   - `SettingsSidebar.tsx` - Right sidebar
   - `BuilderToolbar.tsx` - Left sidebar
   - `Sidebar.tsx` - Base sidebar component
   - All form inputs, buttons, dialogs

3. **Migration pattern:**

   ```tsx
   // Before (if exists)
   <div className="bg-background text-text">

   // After
   <div className="bg-editor-surface text-editor-text">
   ```

### Phase 3: Testing & Validation

1. **Verify isolation:**
   - Editor UI should look identical across different merchant themes
   - Preview iframe should still show merchant theme correctly

2. **Test theme switching:**
   - Toggle `data-editor-theme="light"` / `"dark"`
   - Verify all editor components update correctly

---

## File Changes Summary

### Files to Create/Modify (Editor Folder Only)

1. **`src/app/editor/editor-theme.css`** (NEW)
   - Contains all `--editor-*` CSS variables
   - Default dark theme + light theme variant
   - Editor-scoped base style overrides
   - Completely isolated from merchant code

2. **`src/app/editor/[id]/layout.tsx`**
   - Remove current `:root` reset hack
   - Import `editor-theme.css`
   - Add `<div data-editor-theme="dark">` wrapper

3. **Editor components** (gradual migration)
   - Replace any theme-bound utilities with `editor-*` utilities
   - Keep hardcoded classes where appropriate

### Files Requiring Minimal Global Change

1. **`tailwind.config.ts`** (ONE-TIME addition)
   - Add `editor-*` color utilities in `extend.colors`
   - **Note**: This is a minimal addition that doesn't affect existing code
   - Alternative: Use CSS classes directly instead of Tailwind utilities (more verbose but fully isolated)

### Files NOT to Touch

- ✅ `src/app/globals.css` - No changes needed (editor theme is separate)
- ✅ `src/themes/**/theme.json` - Merchant themes (untouched)
- ✅ `src/ui/theme/ThemeProvider.tsx` - Merchant theme provider (untouched)
- ✅ `src/app/layout.tsx` - Root layout (untouched)
- ✅ Preview iframe logic - Already isolated, no changes needed

---

## Benefits

1. **Complete isolation**: Editor UI never affected by merchant themes
2. **Future-proof**: Easy to add light/dark/high-contrast themes
3. **Clear separation**: `editor-*` utilities make it obvious what's editor vs merchant
4. **No merchant code changes**: Zero impact on storefront/merchant theme system
5. **Maintainable**: Single source of truth for editor theme (CSS variables)

---

## Future Enhancements

1. **Theme toggle UI**: Add dropdown in editor header to switch `data-editor-theme`
2. **User preference**: Store theme preference in localStorage
3. **More themes**: High-contrast, custom themes
4. **Editor-specific typography**: If needed, add `--editor-font-*` variables

---

## Migration Checklist

- [ ] Create `src/app/editor/editor-theme.css` with all editor theme code
- [ ] Extend Tailwind config with `editor-*` utilities (or use CSS classes directly)
- [ ] Update editor layout: import CSS, add `data-editor-theme` wrapper, remove reset hack
- [ ] Audit editor components for theme-bound utilities
- [ ] Migrate components to use `editor-*` utilities
- [ ] Test with different merchant themes
- [ ] Test theme switching (light/dark)
- [ ] Document usage guidelines for future development

## Isolation Strategy

**Goal**: Keep all editor theme changes within `src/app/editor/` folder.

**Achieved by**:

1. ✅ **Editor theme CSS file** (`editor-theme.css`) - All theme code in editor folder
2. ✅ **Editor layout** - Only imports editor CSS, adds wrapper
3. ✅ **No changes to `globals.css`** - Editor theme is completely separate
4. ⚠️ **Tailwind config** - Requires one-time addition (minimal, doesn't affect existing code)
   - **Alternative**: Use CSS classes directly instead of Tailwind utilities for 100% isolation
