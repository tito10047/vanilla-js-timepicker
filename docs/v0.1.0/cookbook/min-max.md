# Min / Max Time

Use `minTime` and `maxTime` to restrict the range of values the picker will accept. These options are always expressed in **24-hour `HH:mm`** notation regardless of the `format` option.

## Basic working hours

```ts
new Timepicker('#shift', {
  minTime: '08:00',
  maxTime: '17:00',
  onInvalid: (err) => {
    if (err.code === 'BELOW_MIN') showError('Too early — pick 08:00 or later')
    if (err.code === 'ABOVE_MAX') showError('Too late — pick 17:00 or earlier')
  },
})
```

Values on the boundary (`08:00` and `17:00`) are accepted.

## With seconds format

When your format includes seconds, express `minTime` and `maxTime` in `HH:mm:ss`:

```ts
new Timepicker('#precise', {
  format: 'HH:mm:ss',
  minTime: '08:00:00',
  maxTime: '17:00:00',
})
```

## Dynamic range — start + end picker pair

Keep the end time always after the start time. Update `minTime` dynamically via `setOptions`:

```ts
const tpStart = new Timepicker('#start', {
  format: 'HH:mm',
  onChange: (value) => {
    tpEnd.setOptions({ minTime: value })
    if (tpEnd.getValue() && tpEnd.getValue() <= value) {
      tpEnd.clear()
    }
  },
})

const tpEnd = new Timepicker('#end', {
  format: 'HH:mm',
})
```

> `setOptions` does not re-render the current dropdown. The new `minTime` is applied the next time the user opens the end picker or calls `setValue`.

## Error codes for range violations

| Code | Meaning |
|---|---|
| `'BELOW_MIN'` | Value is before `minTime`. |
| `'ABOVE_MAX'` | Value is after `maxTime`. |

```ts
new Timepicker('#tp', {
  minTime: '09:00',
  maxTime: '20:00',
  onInvalid: (err) => {
    switch (err.code) {
      case 'BELOW_MIN':
        flash(`Minimum is 09:00, got ${err.value}`)
        break
      case 'ABOVE_MAX':
        flash(`Maximum is 20:00, got ${err.value}`)
        break
    }
  },
})
```

## Pre-filling a value that respects the range

```ts
const tp = new Timepicker('#tp', {
  minTime: '09:00',
  maxTime: '17:00',
})

// If you programmatically set a value outside the range,
// vtp:invalid fires and the input is NOT updated.
await tp.setValue('06:00')    // rejected — BELOW_MIN, input stays empty
await tp.setValue('12:00')    // accepted
```
