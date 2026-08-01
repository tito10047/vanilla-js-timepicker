# Theming & CSS Variables

The timepicker is styled entirely through CSS custom properties (variables). There are no inline styles, no deeply nested selectors, and no specificity fights. Override any variable anywhere in your stylesheet to match your design system.

## Built-in themes

Set the `theme` option at construction time:

| Value | Effect |
|---|---|
| `'light'` | Always uses the light colour palette. |
| `'dark'` | Always uses the dark colour palette. |
| `'auto'` | Follows the user's system `prefers-color-scheme` preference (default). |

```ts
new Timepicker('#tp', { theme: 'dark' })
new Timepicker('#tp', { theme: 'auto' })   // default
```

The theme is applied as a `data-vtp-theme` attribute on the dropdown element (`data-vtp-theme="dark"`, `data-vtp-theme="light"`, or `data-vtp-theme="auto"`).

## CSS custom properties reference

All variables are defined on `:root` (light defaults). The dark overrides are applied under `[data-vtp-theme="dark"]` and under `@media (prefers-color-scheme: dark)` for the `auto` theme.

### Colours

| Variable | Light default | Description |
|---|---|---|
| `--vtp-bg` | `#ffffff` | Dropdown background. |
| `--vtp-bg-hover` | `#f0f4ff` | Cell / button hover background. |
| `--vtp-bg-selected` | `#4361ee` | Selected cell / active button background. |
| `--vtp-bg-disabled` | `#f5f5f5` | Disabled cell background. |
| `--vtp-fg` | `#1a1a2e` | Primary text colour. |
| `--vtp-fg-muted` | `#888` | Muted / secondary text (labels, arrows). |
| `--vtp-fg-selected` | `#ffffff` | Text on selected cells. |
| `--vtp-fg-disabled` | `#bbb` | Text on disabled cells. |
| `--vtp-accent` | `#4361ee` | Accent colour used for focus rings and the Confirm button. |
| `--vtp-border` | `#dde1ef` | Border colour for the dropdown and cells. |

### Shape & typography

| Variable | Default | Description |
|---|---|---|
| `--vtp-radius` | `10px` | Border radius of the dropdown container. |
| `--vtp-radius-sm` | `6px` | Border radius for cells, buttons, and column elements. |
| `--vtp-font` | `system-ui, -apple-system, sans-serif` | Font family used throughout the picker. |
| `--vtp-font-size` | `14px` | Base font size. |
| `--vtp-cell-size` | `44px` | Height (and minimum width) of each grid cell. |

### Shadows & transitions

| Variable | Default | Description |
|---|---|---|
| `--vtp-shadow` | `0 8px 24px rgba(0,0,0,.12)` | Box shadow on the dropdown container. |
| `--vtp-transition` | `0.15s ease` | Duration/easing for hover and selection transitions. |
| `--vtp-z` | `1000` | `z-index` of the dropdown (overridden by the `zIndex` option). |

## Overriding variables

### Global override

Apply to `:root` to affect every picker on the page:

```css
:root {
  --vtp-accent: #e63946;           /* red accent */
  --vtp-bg-selected: #e63946;
  --vtp-radius: 4px;               /* sharper corners */
  --vtp-font: 'Inter', sans-serif;
}
```

### Scoped override

Apply to a specific input's container:

```css
.dark-card {
  --vtp-bg: #1e1e2e;
  --vtp-fg: #e0e0f0;
  --vtp-accent: #7b8cde;
}
```

```html
<div class="dark-card">
  <input id="tp" />
</div>
```

### Overriding the dropdown directly

The dropdown is appended to `document.body` by default, so scoped container overrides won't reach it. Either:

1. Mount the dropdown inside your container by passing `container`:

```ts
new Timepicker('#tp', {
  container: document.querySelector('.dark-card') as HTMLElement,
})
```

2. Or use a global `:root` override with the `[data-vtp-theme]` selector:

```css
[data-vtp-theme="dark"] {
  --vtp-accent: #7b8cde;
}
```

## Animations

Set `animation: 'slide'` for a slight downward entry, or `'none'` to disable animations entirely:

```ts
new Timepicker('#tp', { animation: 'slide' })
new Timepicker('#tp', { animation: 'none' })
```

Users with `prefers-reduced-motion: reduce` automatically get no animation regardless of this option.

## Validating a value (invalid state)

When a value is rejected by the picker (parse failure, range, or validation), the class `vtp-invalid` is added to the input element:

```css
/* Default style in timepicker.css */
.vtp-input.vtp-invalid {
  outline: 2px solid #e63946;
  border-color: #e63946;
}
```

Override it to match your form error style:

```css
.vtp-input.vtp-invalid {
  outline: none;
  border: 2px solid var(--color-error);
  background: var(--color-error-bg);
}
```
