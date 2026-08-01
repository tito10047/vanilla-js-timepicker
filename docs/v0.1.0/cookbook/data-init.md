# Auto-Init via data attribute

`Timepicker.autoInit()` scans the DOM for elements matching a selector (default: `[data-timepicker]`) and initializes a picker for each one. Options are read from the element's `data-timepicker-options` attribute as a JSON string.

This pattern is useful for server-rendered HTML, CMS templates, or any context where you cannot easily call `new Timepicker(...)` per-element.

## Basic usage

### HTML

```html
<input data-timepicker type="text" placeholder="--:--" />

<input
  data-timepicker
  data-timepicker-options='{"format":"hh:mm a","locale":"en","showNowButton":true}'
  type="text"
  placeholder="--:-- AM"
/>

<input
  data-timepicker
  data-timepicker-options='{"format":"HH:mm:ss","minuteStep":5,"secondStep":5}'
  type="text"
  placeholder="--:--:--"
/>
```

### JavaScript

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'

document.addEventListener('DOMContentLoaded', () => {
  const pickers = Timepicker.autoInit()
  console.log(`Initialized ${pickers.length} timepickers`)
})
```

`autoInit()` returns an array of `Timepicker` instances in DOM order.

## Custom selector

```ts
// Only initialize inputs inside .booking-form
Timepicker.autoInit('.booking-form [data-timepicker]')
```

## Setting global defaults before autoInit

```ts
Timepicker.setDefaults({
  locale: 'de',
  minuteStep: 15,
  showClearButton: true,
  theme: 'auto',
})

Timepicker.autoInit()
// All pickers inherit these defaults; per-element options override them.
```

## Re-initializing after dynamic DOM changes

`autoInit()` does not observe future DOM mutations. After injecting new picker inputs via AJAX or a framework, call `autoInit()` on the new container only:

```ts
async function loadBookingForm() {
  const html = await fetch('/booking-form.html').then(r => r.text())
  const container = document.getElementById('form-container')!
  container.innerHTML = html

  // Initialize only the newly added inputs
  Timepicker.autoInit('#form-container [data-timepicker]')
}
```

## Storing the instances for later control

```ts
const pickers = new Map<HTMLElement, Timepicker>()

Timepicker.autoInit().forEach((tp) => {
  pickers.set(tp['input'] as HTMLElement, tp)  // access private field only if needed
})

// Or keep the returned array and index by position:
const [startTp, endTp] = Timepicker.autoInit()
```

## Cleanup

To destroy all auto-initialized pickers:

```ts
const pickers = Timepicker.autoInit()
// ... later:
pickers.forEach((tp) => tp.destroy())
```

## Supported JSON option keys

All `TimepickerOptions` properties that are serializable to JSON are supported in `data-timepicker-options`. Functions (`onChange`, `validate`, `onBeforeOpen`, etc.) cannot be expressed in JSON and must be wired up programmatically after `autoInit`:

```ts
const [tp] = Timepicker.autoInit('[data-timepicker="#departure"]')
tp.on('vtp:change', (detail) => syncToCalendar(detail.value))
```
