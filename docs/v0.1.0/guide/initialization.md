# Initialization & Options

## Constructor signature

```ts
new Timepicker(input: HTMLInputElement | string, options?: TimepickerOptions): Timepicker
```

The first argument is either:
- an `HTMLInputElement` reference, or
- a CSS selector string (e.g. `'#departure'`, `'.time-input'`).

If the selector matches nothing, the constructor throws:
```
Timepicker: element not found for "#departure"
```

## Options reference

### Format

| Option | Type | Default | Description |
|---|---|---|---|
| `format` | `string` | `'HH:mm'` | Display and parse format. Tokens: `HH` (24-hour), `hh` (12-hour), `mm` (minutes), `ss` (seconds), `a` (AM/PM). |
| `locale` | `string \| LocaleConfig` | `'en'` | Built-in locale key (`'en'`, `'sk'`, `'cs'`, `'de'`) or a custom `LocaleConfig` object. |

### Value

| Option | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| Date \| null` | — | Initial value, applied on construction. Takes precedence over `defaultValue`. |
| `defaultValue` | `string \| Date \| null` | — | Fallback initial value used only when `value` is not provided. |
| `minTime` | `string` | `''` | Earliest allowed time in `HH:mm` (or `HH:mm:ss`). Values below this are rejected with `BELOW_MIN`. |
| `maxTime` | `string` | `''` | Latest allowed time. Values above this are rejected with `ABOVE_MAX`. |
| `disabledTimes` | `string[] \| (time: string) => boolean \| Promise<boolean>` | — | Array of exact times to block, or an async function returning `true` to block a time. |
| `renderCell` | `(time: string) => CellRenderResult \| Promise<CellRenderResult>` | — | Custom async renderer applied in both the spinner view (value buttons) and the grid views (individual cells). Receives the formatted time; return `{ clickable, className, title }`. See [Cell Renderer](../cookbook/render-cell.md). |

### Steps

| Option | Type | Default | Description |
|---|---|---|---|
| `hourStep` | `number` | `1` | Increment/decrement step for the hour column. |
| `minuteStep` | `number` | `5` | Increment/decrement step for the minute column. |
| `secondStep` | `number` | `1` | Increment/decrement step for the second column. |

### UI / Position

| Option | Type | Default | Description |
|---|---|---|---|
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Colour scheme. `'auto'` follows `prefers-color-scheme`. |
| `position` | `'auto' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `'auto'` | Preferred dropdown position relative to the input. |
| `container` | `HTMLElement` | — | Custom DOM node to append the dropdown to. Defaults to `document.body`. |
| `zIndex` | `number` | `1000` | CSS `z-index` applied to the dropdown. |
| `animation` | `'fade' \| 'slide' \| 'none'` | `'fade'` | Entry animation for the dropdown. |

### Buttons / Chrome

| Option | Type | Default | Description |
|---|---|---|---|
| `showClearButton` | `boolean` | `false` | Show a "Clear" button in the footer. Clears the value when clicked. |
| `showNowButton` | `boolean` | `false` | Show a "Now" button in the footer. Sets the current time when clicked. |
| `showConfirmButton` | `boolean` | `false` | Show a "Confirm" button. When `true`, changes are not committed until the user clicks Confirm. |
| `showToggleIcon` | `boolean` | `true` | Show a clock icon inside the input that opens/closes the picker on click. |

### Behaviour

| Option | Type | Default | Description |
|---|---|---|---|
| `openOnFocus` | `boolean` | `true` | Open the dropdown when the input receives focus. |
| `closeOnSelect` | `boolean` | `true` | Close the dropdown immediately when a value is selected. Set to `false` if `showConfirmButton` is `true`. |
| `readonlyInput` | `boolean` | `false` | Make the `<input>` read-only. Users can only pick from the dropdown. |
| `allowManualInput` | `boolean` | `true` | Allow users to type directly into the input. If `false`, the input becomes read-only automatically. |
| `parseStrategy` | `'right-fill' \| 'left-fill' \| 'smart'` | `'right-fill'` | How to interpret a partially typed string. See [Parse Strategies](./parsing.md). |
| `autofill` | `boolean` | `true` | On blur, parse and normalise whatever the user typed (e.g. `"930"` → `"09:30"`). |
| `emptyOk` | `boolean` | `true` | Allow an empty value. If `false`, clearing the input is treated as invalid. |
| `strictMode` | `boolean` | `false` | Reserved for future strict validation behaviour. Currently a no-op. |

### Async lifecycle callbacks

These three callbacks can return a `Promise`. The picker waits for the promise to resolve before proceeding.

| Option | Type | Description |
|---|---|---|
| `onBeforeOpen` | `() => boolean \| Promise<boolean>` | Called before the dropdown opens. Return `false` to cancel. |
| `onBeforeChange` | `(next: string, prev: string) => boolean \| Promise<boolean>` | Called before a new value is committed. Return `false` to cancel. |
| `validate` | `(value: string) => boolean \| string \| Promise<boolean \| string>` | Validates the formatted value. Return `true` to accept, `false` or a string message to reject. The string becomes the error message in `TimepickerError`. |

### Sync event callbacks

| Option | Type | Description |
|---|---|---|
| `onOpen` | `() => void` | Fired after the dropdown opens. |
| `onClose` | `(reason: CloseReason) => void` | Fired after the dropdown closes. `reason` is `'select'`, `'escape'`, `'outside'`, or `'api'`. |
| `onChange` | `(value: string, event: TimepickerChangeEvent) => void` | Fired when the committed value changes. |
| `onInput` | `(rawValue: string) => void` | Fired on every keystroke while the user types manually. Not debounced. |
| `onInvalid` | `(err: TimepickerError) => void` | Fired when a value is rejected (parse failure, range check, or validation). |
| `onViewChange` | `(view: TimeView) => void` | Fired when the dropdown switches between `'picker'`, `'hours'`, `'minutes'`, or `'seconds'` views. |

## Global defaults

Set defaults once for all future instances on the page:

```ts
import { Timepicker } from '@tito10047/vanilla-js-timepicker'

Timepicker.setDefaults({
  locale: 'de',
  minuteStep: 15,
  theme: 'dark',
  showNowButton: true,
})

// All subsequent new Timepicker(...) calls inherit these defaults.
// Per-instance options still override them.
new Timepicker('#tp1', { minuteStep: 30 }) // uses 'de', dark, Now button, minuteStep=30
```

`setDefaults` merges shallowly — it does not replace the entire defaults object.

## Common patterns

### Pre-fill from a server value

```ts
new Timepicker('#start', {
  value: serverData.startTime, // e.g. "14:30" or a Date object
})
```

### Read-only time display with open-only picker

```ts
new Timepicker('#display', {
  allowManualInput: false,
  openOnFocus: true,
  showConfirmButton: true,
})
```

### Picker with explicit confirm button

```ts
new Timepicker('#appointment', {
  showConfirmButton: true,
  closeOnSelect: false,  // keep open until Confirm is clicked
})
```

Continue with [Public API](./public-api.md) to learn about the methods available after construction.
