# Cookbook

The cookbook contains ready-to-use patterns for common integration scenarios. Each recipe is self-contained — copy the code and adapt it to your context.

## Recipes

| Recipe | What it covers |
|---|---|
| [Async Validation](./validation.md) | Reject specific times with a server-side check or custom rule. Display a human-readable error message. |
| [Min / Max Time](./min-max.md) | Restrict the selectable range to working hours, business hours, or any interval. |
| [Programmatic Control](./programmatic.md) | `setValue`, `getValue`, `setNow`, `clear`, `open`, `close`, `toggle` — control the picker from your own buttons and logic. |
| [Custom Locale](./custom-locale.md) | Register a French (or any) locale and use it in all pickers on the page. |
| [Auto-Init via data attribute](./data-init.md) | Initialize pickers from HTML attributes without writing any JavaScript per-input. |
| [Before-open / before-change Guards](./guard.md) | Block the picker from opening or a value from being committed based on async conditions. |
| [Cell Renderer](./render-cell.md) | Style individual grid cells with custom CSS classes, tooltips, and non-clickable state — synchronously or asynchronously. |

## Common imports

All recipes assume:

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'
```
