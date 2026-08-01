# Events

The timepicker communicates lifecycle changes through two parallel channels:

1. **Callback options** — functions you pass at construction time (`onChange`, `onOpen`, etc.).
2. **DOM `CustomEvent`s** — dispatched on the `<input>` element; listen with `addEventListener` or framework event bindings.

Both channels fire for every event. Use whichever is more convenient.

## Event reference

### `vtp:beforeopen`

Fired **before** the dropdown opens. Can be cancelled.

- DOM: `CustomEvent`, `cancelable: true`. Call `event.preventDefault()` to prevent opening.
- Callback: `onBeforeOpen(): boolean | Promise<boolean>`. Return `false` to prevent opening.

```ts
// Callback style
new Timepicker('#tp', {
  onBeforeOpen: () => {
    return myForm.isValid()  // false = do not open
  },
})

// DOM style
input.addEventListener('vtp:beforeopen', (e) => {
  if (!myForm.isValid()) e.preventDefault()
})
```

### `vtp:open`

Fired **after** the dropdown opens.

- DOM: `CustomEvent<{ view: TimeView }>`.
- Callback: `onOpen(): void`.

```ts
new Timepicker('#tp', {
  onOpen: () => console.log('picker opened'),
})

input.addEventListener('vtp:open', (e) => {
  console.log('current view:', e.detail.view)  // 'picker' | 'hours' | 'minutes' | 'seconds'
})
```

### `vtp:close`

Fired **after** the dropdown closes.

- DOM: `CustomEvent<{ reason: CloseReason }>`.
- Callback: `onClose(reason: CloseReason): void`.

`CloseReason` values:
| Value | When |
|---|---|
| `'select'` | User selected a value (spinner or grid). |
| `'escape'` | User pressed Escape. |
| `'outside'` | User clicked outside the dropdown. |
| `'api'` | `tp.close()` or `tp.destroy()` was called programmatically. |

```ts
new Timepicker('#tp', {
  onClose: (reason) => {
    if (reason === 'escape') console.log('user cancelled')
  },
})
```

### `vtp:beforechange`

Fired **before** a new value is committed. Can be cancelled.

- DOM: `CustomEvent<{ next: string; prev: string }>`, `cancelable: true`.
- Callback: `onBeforeChange(next, prev): boolean | Promise<boolean>`.

```ts
// Callback style — return false to cancel the change
new Timepicker('#tp', {
  onBeforeChange: async (next, prev) => {
    const ok = await confirmChange(next)
    return ok
  },
})

// DOM style
input.addEventListener('vtp:beforechange', (e) => {
  if (businessLogicSaysNo(e.detail.next)) e.preventDefault()
})
```

### `vtp:change`

Fired **after** a value is successfully committed.

- DOM: `CustomEvent<TimepickerChangeEvent>`.
- Callback: `onChange(value: string, event: TimepickerChangeEvent): void`.

`TimepickerChangeEvent` shape:

```ts
interface TimepickerChangeEvent {
  value: string     // formatted value, e.g. "14:30"
  formatted: string // same as value
  date: Date | null // Date object, or null if value is empty
  prev: string      // previous value before the change
}
```

```ts
new Timepicker('#tp', {
  onChange: (value, event) => {
    console.log(`Changed from ${event.prev} to ${value}`)
    myHiddenInput.value = value
  },
})
```

### `vtp:input`

Fired on **every keystroke** while the user types manually into the input. This is the raw, unparsed value — it is not debounced and does not run through validation.

- DOM: `CustomEvent<{ raw: string }>`.
- Callback: `onInput(rawValue: string): void`.

```ts
new Timepicker('#tp', {
  onInput: (raw) => {
    console.log('User is typing:', raw)  // e.g. "1430" mid-typing
  },
})
```

### `vtp:invalid`

Fired when a value is rejected. This happens when:
- the string cannot be parsed into a valid time,
- the value is below `minTime` or above `maxTime`,
- the `validate` callback returns `false` or an error string.

- DOM: `CustomEvent<TimepickerError>`.
- Callback: `onInvalid(err: TimepickerError): void`.

`TimepickerError` shape:

```ts
interface TimepickerError {
  code: 'INVALID_TIME' | 'BELOW_MIN' | 'ABOVE_MAX' | 'DISABLED' | 'CANCELLED'
  message: string  // human-readable description
  value: string    // the rejected value string
}
```

```ts
new Timepicker('#tp', {
  onInvalid: (err) => {
    showToast(err.message)
    if (err.code === 'BELOW_MIN') highlightField('red')
  },
})
```

### `vtp:viewchange`

Fired when the dropdown switches between its internal views.

- DOM: `CustomEvent<{ to: TimeView }>`.
- Callback: `onViewChange(view: TimeView): void`.

`TimeView` values: `'picker'` | `'hours'` | `'minutes'` | `'seconds'`.

```ts
new Timepicker('#tp', {
  onViewChange: (view) => console.log('now showing:', view),
})
```

### `vtp:destroy`

Fired on `tp.destroy()`. Useful for framework integrations that need to clean up their own side effects.

- DOM: `CustomEvent<{}>` (no detail payload).
- No callback option — subscribe via `tp.on('vtp:destroy', handler)` or `addEventListener`.

```ts
input.addEventListener('vtp:destroy', () => {
  console.log('picker destroyed')
})
```

## Using `tp.on` / `tp.off`

The instance also exposes a typed emitter API. The advantage over `addEventListener` is that handlers receive the detail object directly (no `event.detail` unwrapping):

```ts
const tp = new Timepicker('#tp')

const unsubscribe = tp.on('vtp:change', (detail) => {
  console.log(detail.value)  // string directly
})

// later:
unsubscribe()
// or:
tp.off('vtp:change', handler)
```

`tp.on` returns an unsubscribe function. Store it and call it to remove the listener without needing the original handler reference:

```ts
const off = tp.on('vtp:open', () => trackAnalytics('picker_open'))
// when component unmounts:
off()
```

## Event order for a value change

When a user selects a time from the grid, events fire in this order:

1. `vtp:beforechange` (cancellable)
2. `vtp:change` (value committed)
3. `vtp:close` (if `closeOnSelect` is `true`)
