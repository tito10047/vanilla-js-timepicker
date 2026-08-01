# Getting Started

This page takes you from zero to a working time picker in under five minutes.

## Requirements

| Requirement | Version |
|---|---|
| Node.js | `18.x`, `20.x`, or `22.x` |
| Browser | Any modern browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+) |

No runtime dependencies. Zero.

## 1. Install

```bash
npm install vanilla-js-timepicker
```

## 2. Import

### ES module (bundler — Vite, Rollup, Webpack, etc.)

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'
```

### CommonJS (Node.js tooling)

```js
const { Timepicker } = require('vanilla-js-timepicker')
```

### CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanilla-js-timepicker/dist/timepicker.css" />
<script type="module">
  import { Timepicker } from 'https://cdn.jsdelivr.net/npm/vanilla-js-timepicker/dist/timepicker.esm.js'
  new Timepicker('#time', { showNowButton: true })
</script>
```

Or via the UMD global build:

```html
<script src="https://cdn.jsdelivr.net/npm/vanilla-js-timepicker/dist/timepicker.umd.js"></script>
<script>
  new Timepicker.Timepicker('#time', { showNowButton: true })
</script>
```

## 3. Add an input

```html
<input id="departure" type="text" placeholder="--:--" />
```

> Use `type="text"`, not `type="time"`. The native time input has browser-controlled UI that conflicts with the picker.

## 4. Attach the picker

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'

const tp = new Timepicker('#departure', {
  format: 'HH:mm',
  showNowButton: true,
  onChange: (value) => {
    console.log('Picked:', value) // e.g. "14:30"
  },
})
```

Click the input — the dropdown opens. Use the spinner arrows or click the time value to open the grid.

## 5. Read the selected value

```ts
const value = tp.getValue()  // "14:30"
const date  = tp.getDate()   // Date object at today 14:30
```

## 6. Clean up when done

```ts
// When the form element is removed from the DOM:
tp.destroy()
```

`destroy()` removes all event listeners, closes the dropdown, strips the ARIA attributes, and fires `vtp:destroy` on the input.

## What just happened

`new Timepicker(input, options)` performed these steps:

1. Located the `<input>` element (by CSS selector or direct reference).
2. Applied ARIA attributes: `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded="false"`.
3. If `value` or `defaultValue` was provided, set the input value and parsed the initial time.
4. Registered `focus` (if `openOnFocus` is `true`), `input`, `blur`, and `keydown` listeners.
5. Wired up any provided callback options (`onChange`, `onOpen`, etc.) to the internal event emitter.

The dropdown itself is created lazily — only when the picker is opened for the first time.

## Next steps

- Learn all constructor options in [Initialization & Options](./initialization.md).
- Explore the programmatic API in [Public API](./public-api.md).
- Read about events and callbacks in [Events](./events.md).
