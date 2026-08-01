# Public API

Every method on a `Timepicker` instance is documented here. Methods that touch the dropdown or the committed value return `Promise<void>` so you can `await` them in async code.

## Instance methods

### `open(): Promise<void>`

Opens the dropdown. A no-op if the picker is already open or has been destroyed.

Before opening, the method:
1. Runs the `onBeforeOpen` guard (if provided). Cancels if it returns `false`.
2. Dispatches the cancellable `vtp:beforeopen` `CustomEvent` on the input. Cancels if the event is `preventDefault()`-ed.

```ts
await tp.open()
```

### `close(reason?: CloseReason): Promise<void>`

Closes the dropdown. `reason` defaults to `'api'`. A no-op if the picker is already closed.

```ts
await tp.close()
await tp.close('escape')  // programmatically simulate Escape press
```

Possible `CloseReason` values: `'select'` | `'escape'` | `'outside'` | `'api'`.

### `toggle(): Promise<void>`

Opens the picker if it is closed; closes it if it is open.

```ts
await tp.toggle()
```

### `setValue(value: string | Date | null): Promise<void>`

Sets the picker value programmatically. Goes through the full validation pipeline:

1. Parses the string (or formats the `Date`) using the active `parseStrategy` and `format`.
2. Checks `minTime` / `maxTime`. Fires `vtp:invalid` and returns early if out of range.
3. Runs the `validate` callback. Fires `vtp:invalid` and returns early if rejected.
4. Runs the `onBeforeChange` guard. Returns early if it returns `false`.
5. Dispatches the cancellable `vtp:beforechange` `CustomEvent`. Returns early if prevented.
6. Updates the input value and internal state.
7. Fires `onChange` / `vtp:change`.

```ts
await tp.setValue('14:30')
await tp.setValue(new Date())    // uses the Date's hours/minutes/seconds
await tp.setValue(null)          // clears the value (when emptyOk is true)
await tp.setValue('')            // same as null
```

If the value fails parsing or validation, the input is **not** updated and `vtp:invalid` fires instead.

### `clear(): Promise<void>`

Shorthand for `setValue(null)`. Clears the value when `emptyOk` is `true` (the default).

```ts
await tp.clear()
```

### `setNow(): Promise<void>`

Sets the picker to the current time (`new Date()`), formatted according to `format`.

```ts
await tp.setNow()
```

### `getValue(): string`

Returns the current committed value as a formatted string, or `''` if no value is set.

```ts
const value = tp.getValue()  // e.g. "14:30"
```

### `getDate(): Date | null`

Returns a `Date` object representing the selected time, or `null` if the picker is empty. The date portion is today's date; only the time fields (`hours`, `minutes`, `seconds`) are meaningful.

```ts
const d = tp.getDate()
if (d) {
  console.log(d.getHours(), d.getMinutes())
}
```

### `isOpen(): boolean`

Returns `true` if the dropdown is currently visible.

```ts
if (tp.isOpen()) {
  await tp.close()
}
```

### `isValid(): Promise<boolean>`

Runs the full validation pipeline (parse + `validate` callback) against the current value. Returns `true` if the value is valid or if the picker is empty and `emptyOk` is `true`.

```ts
if (!await tp.isValid()) {
  form.reportValidity()
}
```

### `on(event, handler): () => void`

Subscribes to an internal emitter event. Returns an unsubscribe function.

```ts
const off = tp.on('vtp:change', (detail) => {
  console.log('new value:', detail.value)
})

// later:
off()  // unsubscribe
```

See [Events](./events.md) for the full list of event names and their payloads.

### `off(event, handler): void`

Removes a specific handler that was added with `on`. You must pass the same function reference.

```ts
const handler = (detail) => console.log(detail)
tp.on('vtp:change', handler)
tp.off('vtp:change', handler)
```

### `setOptions(partial: Partial<TimepickerOptions>): void`

Merges new options into the active options. Useful for runtime reconfiguration.

```ts
tp.setOptions({ minTime: '09:00', maxTime: '18:00' })
tp.setOptions({ locale: 'de' })
```

> **Note:** `setOptions` does not re-initialize the picker. Changes to `format`, `locale`, or UI options only take effect the next time the dropdown is opened.

### `focus(): void`

Focuses the underlying `<input>` element. If `openOnFocus` is `true`, this will also open the dropdown.

```ts
tp.focus()
```

### `destroy(): void`

Tears down the picker completely:
- Closes the dropdown if open.
- Removes all event listeners attached to the input.
- Removes ARIA attributes (`role`, `aria-haspopup`, `aria-expanded`).
- Removes the `vtp-input` CSS class.
- Fires `vtp:destroy` on the input.

After `destroy()`, the `Timepicker` instance is inert. Do not call any other methods on it.

```ts
tp.destroy()
```

Always call `destroy()` before removing the input from the DOM to prevent memory leaks.

## Static methods

### `Timepicker.setDefaults(partial): void`

Sets global default options for all future instances. See [Initialization](./initialization.md#global-defaults).

```ts
Timepicker.setDefaults({ locale: 'sk', minuteStep: 15 })
```

### `Timepicker.autoInit(selector?): Timepicker[]`

Finds all elements matching `selector` (default: `[data-timepicker]`) and creates a `Timepicker` for each one. Options are read from the element's `data-timepicker-options` attribute as JSON.

```html
<input data-timepicker data-timepicker-options='{"format":"HH:mm:ss","showNowButton":true}' />
```

```ts
const pickers = Timepicker.autoInit() // returns Timepicker[]
```

See the [Auto-Init cookbook](../cookbook/data-init.md) for a complete example.

### `Timepicker.parse(text, opts?): string | null`

Parses a raw string into a formatted time string without creating a picker instance. Returns `null` if parsing fails.

```ts
Timepicker.parse('930')           // "09:30" (right-fill, default)
Timepicker.parse('930', { strategy: 'left-fill' })   // "09:30"
Timepicker.parse('93000', { strategy: 'right-fill', hasSeconds: true }) // "09:30:00"
Timepicker.parse('abc')           // null
```

### `Timepicker.format(date, format?): string`

Formats a `Date` object into a time string.

```ts
Timepicker.format(new Date(), 'HH:mm')    // "14:30"
Timepicker.format(new Date(), 'hh:mm a')  // "02:30 PM"
```
