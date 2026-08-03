# API Reference

Complete reference for all public exports of `@tito10047/vanilla-js-timepicker`.

## Class

### `Timepicker`

The main class. Attach it to any `<input>` element.

```ts
import { Timepicker } from '@tito10047/vanilla-js-timepicker'

const tp = new Timepicker(input, options)
```

#### Constructor

```ts
new Timepicker(input: HTMLInputElement | string, options?: TimepickerOptions): Timepicker
```

Throws if the selector does not match any element.

#### Instance methods

| Method | Returns | Description |
|---|---|---|
| `open()` | `Promise<void>` | Open the dropdown. Runs `onBeforeOpen` guard. |
| `close(reason?)` | `Promise<void>` | Close the dropdown. `reason` defaults to `'api'`. |
| `toggle()` | `Promise<void>` | Open if closed, close if open. |
| `setValue(value)` | `Promise<void>` | Set the value. Runs full validation pipeline. |
| `clear()` | `Promise<void>` | Clear the value (`setValue(null)`). |
| `setNow()` | `Promise<void>` | Set to the current time. |
| `getValue()` | `string` | Return the current formatted value, or `''`. |
| `getDate()` | `Date \| null` | Return a `Date` object for the current time, or `null`. |
| `isOpen()` | `boolean` | Return `true` if the dropdown is visible. |
| `isValid()` | `Promise<boolean>` | Run validation against the current value. |
| `on(event, handler)` | `() => void` | Subscribe to an event. Returns an unsubscribe function. |
| `off(event, handler)` | `void` | Remove an event handler. |
| `setOptions(partial)` | `void` | Merge new options. Effective on next open. |
| `focus()` | `void` | Focus the input element. |
| `destroy()` | `void` | Remove all listeners and ARIA attributes. |

#### Static methods

| Method | Returns | Description |
|---|---|---|
| `Timepicker.getInstance(el)` | `Timepicker \| null` | Return the instance attached to an element or selector, or `null`. |
| `Timepicker.setDefaults(partial)` | `void` | Set global option defaults for all future instances. |
| `Timepicker.autoInit(selector?)` | `Timepicker[]` | Init all matching elements. Default selector: `[data-timepicker]`. |
| `Timepicker.parse(text, opts?)` | `string \| null` | Parse a raw string to a formatted time string. |
| `Timepicker.format(date, format?)` | `string` | Format a `Date` object to a time string. |

---

## Standalone functions

```ts
import { parseRightFill, parseLeftFill, parseSmart, parseAny } from '@tito10047/vanilla-js-timepicker'
import { formatTime, tokenize } from '@tito10047/vanilla-js-timepicker'
import { registerLocale } from '@tito10047/vanilla-js-timepicker'
```

### `parseRightFill(input, opts): ParsedTime | null`

Parse a string right-to-left (last digits = minutes). See [Parse Strategies](../guide/parsing.md).

### `parseLeftFill(input, opts): ParsedTime | null`

Parse a string left-to-right (first digits = hours).

### `parseSmart(input, opts): ParsedTime | null`

Currently an alias for `parseLeftFill`.

### `parseAny(input, opts, strategy?): ParsedTime | null`

Parse using any strategy. `strategy` defaults to `'right-fill'`.

```ts
interface ParseOptions {
  hasSeconds: boolean
}
```

### `formatTime(time, format): string`

Format a `ParsedTime` object to a string using the given format tokens.

```ts
formatTime({ h: 14, m: 30, s: 0 }, 'HH:mm')    // "14:30"
formatTime({ h: 14, m: 30, s: 0 }, 'hh:mm a')   // "02:30 PM"
```

### `tokenize(format): FormatTokens`

Analyze a format string and return which tokens are present.

```ts
interface FormatTokens {
  hasHours: boolean
  hasMinutes: boolean
  hasSeconds: boolean
  is12h: boolean
}
```

### `registerLocale(name, config): void`

Register a custom locale under a string key.

```ts
import type { LocaleConfig } from '@tito10047/vanilla-js-timepicker'
registerLocale('fr', { title: "Choisir l'heure", ... } as LocaleConfig)
```

---

## Types

```ts
import type {
  TimepickerOptions,
  TimepickerChangeEvent,
  TimepickerError,
  TimepickerEventName,
  LocaleConfig,
  ParsedTime,
  TimeView,
  ThemeOption,
  PositionOption,
  ParseStrategy,
  AnimationOption,
  CloseReason,
  DisabledTimesFn,
  CellRenderResult,
  CellRenderer,
} from '@tito10047/vanilla-js-timepicker'
```

### `TimepickerOptions`

Full options object. All fields optional. See [Initialization & Options](../guide/initialization.md).

### `TimepickerChangeEvent`

```ts
interface TimepickerChangeEvent {
  value: string
  formatted: string
  date: Date | null
  prev: string
}
```

### `TimepickerError`

```ts
interface TimepickerError {
  code: 'INVALID_TIME' | 'BELOW_MIN' | 'ABOVE_MAX' | 'DISABLED' | 'CANCELLED'
  message: string
  value: string
}
```

### `ParsedTime`

```ts
interface ParsedTime { h: number; m: number; s: number }
```

### `LocaleConfig`

```ts
interface LocaleConfig {
  title: string
  hoursLabel: string
  minutesLabel: string
  secondsLabel: string
  amLabel: string
  pmLabel: string
  nowLabel: string
  clearLabel: string
  confirmLabel: string
}
```

### `CellRenderResult`

Return value of the `renderCell` option. All fields are optional.

```ts
interface CellRenderResult {
  className?: string | string[]  // CSS class(es) added to the cell <button>
  clickable?: boolean            // false = aria-disabled + click blocked (default: true)
  title?: string                 // tooltip text and aria-label override
}
```

### `CellRenderer`

The type of the `renderCell` option.

```ts
type CellRenderer = (time: string) => CellRenderResult | Promise<CellRenderResult>
```

The `time` argument carries the full formatted time in both contexts:

- **Spinner (picker) view** — called once per `update()` (open + every arrow click) with the full current time. The result's `className` and `title` are applied to all value buttons (`"09"`, `"30"`, `"45"`). Stale results from rapid scrolling are automatically discarded via an internal sequence counter.
- **Grid views** — called once per cell (all in parallel) with the time that cell would commit. For the hours grid this is `"HH:mm"` with the candidate hour and the current minute; for the minutes grid it is the current hour with the candidate minute; and so on.

```ts
import type { CellRenderer } from '@tito10047/vanilla-js-timepicker'

const renderer: CellRenderer = async (time) => {
  const busy = await checkServer(time)
  return { clickable: !busy, className: busy ? 'slot-busy' : undefined }
}

new Timepicker('#tp', { renderCell: renderer })
```

See the [Cell Renderer cookbook](../cookbook/render-cell.md) for complete examples.

### Primitive union types

| Type | Values |
|---|---|
| `ThemeOption` | `'light' \| 'dark' \| 'auto'` |
| `PositionOption` | `'auto' \| 'top' \| 'bottom' \| 'left' \| 'right'` |
| `ParseStrategy` | `'right-fill' \| 'left-fill' \| 'smart'` |
| `AnimationOption` | `'fade' \| 'slide' \| 'none'` |
| `CloseReason` | `'select' \| 'escape' \| 'outside' \| 'api'` |
| `TimeView` | `'picker' \| 'hours' \| 'minutes' \| 'seconds'` |
| `TimepickerEventName` | all `vtp:*` event name strings |
| `DisabledTimesFn` | `(time: string) => boolean \| Promise<boolean>` |
| `CellRenderer` | `(time: string) => CellRenderResult \| Promise<CellRenderResult>` |

---

## Events reference

| Event name | Payload | Cancellable | Description |
|---|---|---|---|
| `vtp:beforeopen` | `{}` | Yes | Before the dropdown opens. |
| `vtp:open` | `{ view: TimeView }` | No | After the dropdown opens. |
| `vtp:close` | `{ reason: CloseReason }` | No | After the dropdown closes. |
| `vtp:beforechange` | `{ next: string; prev: string }` | Yes | Before a new value is committed. |
| `vtp:change` | `TimepickerChangeEvent` | No | After a value is committed. |
| `vtp:input` | `{ raw: string }` | No | On every manual keystroke. |
| `vtp:invalid` | `TimepickerError` | No | When a value is rejected. |
| `vtp:viewchange` | `{ to: TimeView }` | No | When the dropdown view changes. |
| `vtp:destroy` | `{}` | No | When `destroy()` is called. |

See [Events](../guide/events.md) for full documentation and code examples.
