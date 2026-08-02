# TypeScript

`@tito10047/vanilla-js-timepicker` is written in TypeScript and ships with declaration files. You get full type coverage with no additional `@types` package needed.

## Type declarations file

```
dist/types/index.d.ts
```

This is pointed to by the `"types"` field in `package.json` and is resolved automatically by TypeScript.

## Exported types

All public types are exported from the package root:

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
} from '@tito10047/vanilla-js-timepicker'
```

## Key type definitions

### `TimepickerOptions`

The full options interface. Every property is optional.

```ts
interface TimepickerOptions {
  // Format
  format?: string
  locale?: string | LocaleConfig

  // Value
  value?: string | Date | null
  defaultValue?: string | Date | null
  minTime?: string
  maxTime?: string
  disabledTimes?: string[] | ((time: string) => boolean | Promise<boolean>)

  // Steps
  hourStep?: number
  minuteStep?: number
  secondStep?: number

  // UI
  theme?: ThemeOption          // 'light' | 'dark' | 'auto'
  position?: PositionOption    // 'auto' | 'top' | 'bottom' | 'left' | 'right'
  container?: HTMLElement
  zIndex?: number
  animation?: AnimationOption  // 'fade' | 'slide' | 'none'

  // Buttons
  showClearButton?: boolean
  showNowButton?: boolean
  showConfirmButton?: boolean
  showToggleIcon?: boolean

  // Behaviour
  openOnFocus?: boolean
  closeOnSelect?: boolean
  readonlyInput?: boolean
  allowManualInput?: boolean
  parseStrategy?: ParseStrategy  // 'right-fill' | 'left-fill' | 'smart'
  autofill?: boolean
  emptyOk?: boolean
  strictMode?: boolean

  // Async lifecycle
  onBeforeOpen?: () => boolean | Promise<boolean>
  onBeforeChange?: (next: string, prev: string) => boolean | Promise<boolean>
  validate?: (value: string) => boolean | string | Promise<boolean | string>

  // Callbacks
  onOpen?: () => void
  onClose?: (reason: CloseReason) => void
  onChange?: (value: string, e: TimepickerChangeEvent) => void
  onInput?: (rawValue: string) => void
  onInvalid?: (err: TimepickerError) => void
  onViewChange?: (view: TimeView) => void
}
```

### `TimepickerChangeEvent`

Payload of `onChange` and the `vtp:change` DOM event:

```ts
interface TimepickerChangeEvent {
  value: string      // formatted value, e.g. "14:30"
  formatted: string  // alias for value
  date: Date | null  // Date object at today's date with selected time
  prev: string       // previous formatted value before the change
}
```

### `TimepickerError`

Payload of `onInvalid` and the `vtp:invalid` DOM event:

```ts
interface TimepickerError {
  code: 'INVALID_TIME' | 'BELOW_MIN' | 'ABOVE_MAX' | 'DISABLED' | 'CANCELLED'
  message: string  // human-readable description
  value: string    // the rejected value string
}
```

### `ParsedTime`

Internal representation of a time, returned by parse functions:

```ts
interface ParsedTime {
  h: number  // 0–23
  m: number  // 0–59
  s: number  // 0–59
}
```

### `LocaleConfig`

Custom locale shape:

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

### `TimepickerEventName`

Union of all valid event name strings for `tp.on()` / `tp.off()`:

```ts
type TimepickerEventName =
  | 'vtp:beforeopen'
  | 'vtp:open'
  | 'vtp:close'
  | 'vtp:input'
  | 'vtp:beforechange'
  | 'vtp:change'
  | 'vtp:invalid'
  | 'vtp:hourselect'
  | 'vtp:minuteselect'
  | 'vtp:secondselect'
  | 'vtp:viewchange'
  | 'vtp:destroy'
```

## Typing the `on()` handler

The `on()` method is generic. TypeScript can infer the payload type from the event name when you annotate it:

```ts
tp.on<TimepickerChangeEvent>('vtp:change', (detail) => {
  // detail: TimepickerChangeEvent
  console.log(detail.value, detail.prev)
})

tp.on<TimepickerError>('vtp:invalid', (detail) => {
  // detail: TimepickerError
  console.log(detail.code, detail.message)
})
```

## DOM CustomEvent typing

When listening via `addEventListener`, cast `event.detail` to the appropriate type:

```ts
input.addEventListener('vtp:change', (e) => {
  const detail = (e as CustomEvent<TimepickerChangeEvent>).detail
  console.log(detail.value)
})
```

Or extend the global `HTMLElementEventMap` in your project's declarations:

```ts
// src/timepicker.d.ts
import type { TimepickerChangeEvent, TimepickerError } from '@tito10047/vanilla-js-timepicker'

declare global {
  interface HTMLElementEventMap {
    'vtp:change': CustomEvent<TimepickerChangeEvent>
    'vtp:invalid': CustomEvent<TimepickerError>
    'vtp:open': CustomEvent<{ view: string }>
    'vtp:close': CustomEvent<{ reason: string }>
  }
}
```

After this, `addEventListener('vtp:change', ...)` is fully typed without the cast.

## `tsconfig.json` requirements

No special configuration is needed. The package uses standard ES2020 features and ships both declaration files and source maps.

If you use `"moduleResolution": "bundler"` or `"node16"` / `"nodenext"`, the `exports` field in `package.json` is respected and TypeScript will find the types automatically.
