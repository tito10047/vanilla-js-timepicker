# Accessibility

The timepicker is designed to be usable without a mouse. It follows WAI-ARIA patterns for comboboxes and dialogs.

## ARIA roles and attributes

### Input element

When the picker is initialized, the following attributes are added to the `<input>`:

| Attribute | Value | Purpose |
|---|---|---|
| `role` | `combobox` | Identifies the input as a combobox that opens a popup. |
| `aria-haspopup` | `dialog` | Indicates the popup type. |
| `aria-expanded` | `false` / `true` | Updated when the dropdown opens and closes. |
| `autocomplete` | `off` | Prevents browser autocomplete from overlapping the picker. |

These attributes are removed by `destroy()`.

### Dropdown

The dropdown container carries `role="dialog"` implicitly through its structure. Each spinner column has:

| Attribute | Value |
|---|---|
| `role` | `spinbutton` |
| `aria-label` | Locale-resolved label (e.g. "Hours", "Minutes") |
| `aria-valuenow` | Current numeric value |

The up/down arrow buttons have `aria-label="Increase hours"` / `"Decrease minutes"` etc. The time value buttons (click to open the grid view) have `aria-label="hours, click to select from list"`.

### Grid view cells

Each clickable cell in the hour/minute/second grid has:

| Attribute | Value |
|---|---|
| `role` | `button` (via `<button>` element) |
| `aria-selected` | `"true"` on the currently selected cell |
| `aria-disabled` | `"true"` on disabled cells |

### Live region

An `aria-live="polite"` region is injected visually off-screen. It announces selection changes to screen readers without moving focus.

### Invalid input

When a value is rejected, the class `vtp-invalid` is added to the input. You can connect this to a visible error message by linking the message with `aria-describedby`:

```html
<input id="start" aria-describedby="start-error" />
<span id="start-error" class="error" hidden></span>
```

```ts
new Timepicker('#start', {
  onInvalid: (err) => {
    const msg = document.getElementById('start-error')!
    msg.textContent = err.message
    msg.hidden = false
  },
  onChange: () => {
    document.getElementById('start-error')!.hidden = true
  },
})
```

## Keyboard navigation

### On the input

| Key | Action |
|---|---|
| `Enter` | Triggers autofill (normalises the typed value). |
| `Escape` | Closes the dropdown (reason: `'escape'`). |

### In the spinner (picker) view

| Key | Action |
|---|---|
| `ArrowUp` | Increment the focused column by one step. |
| `ArrowDown` | Decrement the focused column by one step. |
| `PageUp` | Increment by a large step (currently same as `ArrowUp`). |
| `PageDown` | Decrement by a large step. |
| `Home` | Set the column to its minimum value (0 for all columns). |
| `End` | Set the column to its maximum value (23 for hours, 59 for minutes/seconds). |
| `ArrowRight` | Move focus to the next column (minute → second). |
| `ArrowLeft` | Move focus to the previous column. |
| `Enter` | Confirm the selection (same as clicking "Confirm" when shown). |
| `Escape` | Close the dropdown. |

### In the grid view

| Key | Action |
|---|---|
| Arrow keys | Navigate between cells. |
| `Enter` / `Space` | Select the focused cell. |
| `Escape` | Return to the spinner view. |

## Focus trap

When the dropdown is open, focus is trapped inside it. Pressing `Tab` cycles through the interactive elements (up arrows, time values, down arrows, footer buttons). Pressing `Escape` or selecting a value releases the trap and returns focus to the input.

## Reduced motion

The CSS file includes:

```css
@media (prefers-reduced-motion: reduce) {
  .vtp-dropdown {
    animation: none !important;
    transition: none !important;
  }
}
```

Users who have opted into reduced motion see no entry animation, regardless of the `animation` option.

## Testing accessibility

The picker works with VoiceOver (macOS / iOS), NVDA (Windows), and JAWS. Screen readers announce:
- "Select time, collapsed" on the input (from `role="combobox"` and `aria-expanded="false"`).
- "expanded" when the dropdown opens.
- The new time value via the live region after each change.

Use `axe-core` or `@axe-core/playwright` to run automated accessibility checks on your integration:

```ts
import { checkA11y } from 'axe-playwright'

await checkA11y(page, '#departure')
```
