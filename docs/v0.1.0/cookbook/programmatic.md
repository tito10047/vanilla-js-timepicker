# Programmatic Control

This recipe shows how to drive the picker entirely from your own buttons and application logic.

## Basic control panel

```html
<input id="tp" type="text" placeholder="--:--" />

<div class="controls">
  <button id="btn-now">Now</button>
  <button id="btn-set">Set 09:15</button>
  <button id="btn-clear">Clear</button>
  <button id="btn-get">Alert value</button>
  <button id="btn-open">Open</button>
  <button id="btn-close">Close</button>
  <button id="btn-toggle">Toggle</button>
</div>
```

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'

const tp = new Timepicker('#tp', {
  onChange: (v) => console.log('onChange:', v),
  onInvalid: (e) => console.warn('invalid:', e.message),
})

document.getElementById('btn-now')!.addEventListener('click', () => tp.setNow())
document.getElementById('btn-set')!.addEventListener('click', () => tp.setValue('09:15'))
document.getElementById('btn-clear')!.addEventListener('click', () => tp.clear())
document.getElementById('btn-get')!.addEventListener('click', () => alert(tp.getValue()))
document.getElementById('btn-open')!.addEventListener('click', () => tp.open())
document.getElementById('btn-close')!.addEventListener('click', () => tp.close())
document.getElementById('btn-toggle')!.addEventListener('click', () => tp.toggle())
```

## Reading the value from a form

```ts
form.addEventListener('submit', (e) => {
  e.preventDefault()
  const time = tp.getValue()   // "" if empty
  const date = tp.getDate()    // Date | null

  if (!time) {
    showError('Please select a time')
    return
  }

  submitData({ time, hours: date!.getHours(), minutes: date!.getMinutes() })
})
```

## Pre-filling from a stored value

```ts
const savedTime = localStorage.getItem('departure') ?? ''

const tp = new Timepicker('#departure', {
  value: savedTime || null,
  onChange: (v) => localStorage.setItem('departure', v),
})
```

## Resetting the picker

```ts
async function resetForm() {
  await tp.clear()               // clears the value
  tp.setOptions({ minTime: '' }) // reset any dynamic constraints
}
```

## Checking state before navigation

```ts
nextStepBtn.addEventListener('click', async () => {
  if (!await tp.isValid()) {
    tp.focus()  // bring the user back to the input
    return
  }
  goToNextStep()
})
```

## Setting a value from a `Date` object

```ts
const meeting = new Date('2026-08-01T14:30:00')
await tp.setValue(meeting)
console.log(tp.getValue())  // "14:30"
```

## Listening for changes via the DOM event

Useful in frameworks that prefer DOM event delegation:

```ts
document.querySelector('#tp')!.addEventListener('vtp:change', (e) => {
  const { value, prev } = (e as CustomEvent).detail
  console.log(`Changed: ${prev} → ${value}`)
})
```

## Dynamically updating options

```ts
// Switch from 24-hour to 12-hour at runtime:
tp.setOptions({ format: 'hh:mm a' })

// Change the minuteStep:
tp.setOptions({ minuteStep: 1 })
```

> The new options take effect the next time the dropdown opens. The input value is not re-formatted automatically — call `setValue(tp.getValue())` to re-format if needed.

## Cleanup

```ts
// When the section containing the input is removed from the DOM:
section.remove()
tp.destroy()
```
