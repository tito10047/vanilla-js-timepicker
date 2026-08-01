# Async Validation

The `validate` option accepts a function that can return a `Promise`. Use it to check a time against a remote source, a local rule set, or any async condition.

## Basic: block a specific time

```ts
new Timepicker('#appointment', {
  validate: (value) => {
    return value === '12:00'
      ? 'Lunch break — no appointments at 12:00'
      : true
  },
  onInvalid: (err) => {
    showError(err.message)
  },
  onChange: () => {
    clearError()
  },
})
```

`validate` receives the formatted string (e.g. `"12:00"`). Return:
- `true` → accepted.
- `false` → rejected with a generic message.
- `string` → rejected with that string as the error message.

## Async: check against a server

```ts
new Timepicker('#slot', {
  validate: async (value) => {
    const res = await fetch(`/api/slots/available?time=${value}`)
    const { available } = await res.json()
    return available ? true : `${value} is already booked`
  },
  onInvalid: (err) => {
    document.getElementById('slot-error')!.textContent = err.message
  },
})
```

The picker waits for the `Promise` to resolve before closing. If validation fails, the dropdown stays open (if `closeOnSelect: false`) or the `vtp-invalid` class is applied to the input.

## Show inline error messages

Connect the error message to the input via `aria-describedby` for accessibility:

```html
<div class="field">
  <input id="start" type="text" aria-describedby="start-error" />
  <span id="start-error" class="field-error" hidden></span>
</div>
```

```ts
const errorEl = document.getElementById('start-error')!

new Timepicker('#start', {
  validate: (v) => {
    if (v < '08:00') return 'Must be at least 08:00'
    if (v > '18:00') return 'Must be no later than 18:00'
    return true
  },
  onInvalid: (err) => {
    errorEl.textContent = err.message
    errorEl.hidden = false
  },
  onChange: () => {
    errorEl.hidden = true
  },
})
```

## Block multiple specific times

```ts
const reserved = ['09:00', '10:30', '14:00', '16:30']

new Timepicker('#pick', {
  validate: (v) =>
    reserved.includes(v) ? `${v} is reserved — choose another time` : true,
})
```

## Validate against another picker's value

Ensure an end time is always after a start time:

```ts
const tpStart = new Timepicker('#start', { format: 'HH:mm' })

const tpEnd = new Timepicker('#end', {
  format: 'HH:mm',
  validate: (v) => {
    const start = tpStart.getValue()
    if (!start) return true  // nothing to compare against
    return v > start ? true : `End time must be after ${start}`
  },
})
```

## Using `isValid()` before form submission

```ts
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!await tp.isValid()) {
    showError('Please select a valid time')
    return
  }
  submitForm({ time: tp.getValue() })
})
```
