# vanilla-js-timepicker

[![Test](https://github.com/tito10047/vanilla-js-timepicker/actions/workflows/test.yml/badge.svg)](https://github.com/tito10047/vanilla-js-timepicker/actions/workflows/test.yml)
[![Deploy Docs & Demo](https://github.com/tito10047/vanilla-js-timepicker/actions/workflows/docs.yml/badge.svg)](https://github.com/tito10047/vanilla-js-timepicker/actions/workflows/docs.yml)
[![npm version](https://img.shields.io/npm/v/vanilla-js-timepicker.svg)](https://www.npmjs.com/package/vanilla-js-timepicker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**[📖 Documentation](https://tito10047.github.io/vanilla-js-timepicker/) · [▶ Live Demo](https://tito10047.github.io/vanilla-js-timepicker/demo/)**

Lightweight, dependency-free time picker for vanilla JavaScript and TypeScript.

![vanilla-js-timepicker demo](./docs/assets/timepicker-demo.gif)

---

## Features

- **Zero dependencies** — no jQuery, no Moment, no framework required.
- **TypeScript first** — written in TypeScript, ships full declaration files.
- **24h · 12h · seconds** — `HH:mm`, `hh:mm a`, `HH:mm:ss` formats from a single `format` string.
- **Async lifecycle hooks** — `onBeforeOpen`, `onBeforeChange`, and `validate` accept Promises.
- **Custom cell renderer** — `renderCell` lets you style and disable individual grid cells asynchronously (e.g. mark booked slots grey and non-clickable).
- **Fully accessible** — ARIA `combobox`, `dialog`, `spinbutton` roles; full keyboard navigation.
- **CSS-variable theming** — light, dark, and auto (system) themes; 20+ override-ready variables.
- **Internationalization** — built-in English, Slovak, Czech, German; register any custom locale.
- **Multiple formats** — ESM, CommonJS, and UMD builds.

---

## Installation

```bash
npm install vanilla-js-timepicker
```

## Quick start

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'

const tp = new Timepicker('#departure', {
  format: 'HH:mm',
  minuteStep: 15,
  showNowButton: true,
  showClearButton: true,
  locale: 'en',
  onChange: (value) => {
    console.log('Selected:', value) // e.g. "14:30"
  },
})
```

```html
<input id="departure" type="text" placeholder="--:--" />
```

## CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanilla-js-timepicker/dist/timepicker.css" />
<script type="module">
  import { Timepicker } from 'https://cdn.jsdelivr.net/npm/vanilla-js-timepicker/dist/timepicker.esm.js'
  new Timepicker('#time', { showNowButton: true })
</script>
```

---

## Usage examples

### 24-hour with min/max

```ts
new Timepicker('#work-start', {
  format: 'HH:mm',
  minTime: '08:00',
  maxTime: '17:00',
  minuteStep: 15,
  onInvalid: (err) => showError(err.message),
})
```

### 12-hour AM/PM

```ts
new Timepicker('#alarm', {
  format: 'hh:mm a',
  locale: 'en',
  showConfirmButton: true,
  closeOnSelect: false,
})
```

### With seconds

```ts
new Timepicker('#precise', {
  format: 'HH:mm:ss',
  minuteStep: 5,
  secondStep: 5,
})
```

### Async validation

```ts
new Timepicker('#slot', {
  validate: async (value) => {
    const { available } = await fetch(`/api/slots?time=${value}`).then(r => r.json())
    return available ? true : `${value} is already booked`
  },
  onInvalid: (err) => showError(err.message),
})
```

### Custom cell renderer — spinner view and grid view

`renderCell` works in both the spinner (value buttons you click to open the grid) and in the grid cells themselves. Pass a sync or async function; it receives the full formatted time and returns `{ className, title, clickable }`.

```ts
import type { CellRenderResult } from 'vanilla-js-timepicker'

new Timepicker('#appointment', {
  format: 'HH:mm',
  minuteStep: 30,
  renderCell: async (time): Promise<CellRenderResult> => {
    const { available } = await fetch(`/api/slots?time=${time}`).then(r => r.json())
    return {
      clickable: available,
      className: available ? undefined : 'vtp-cell--booked',
      title: available ? time : `${time} is already booked`,
    }
  },
})
```

```css
/* Applied to value buttons in the spinner and to cells in the grid */
.vtp-cell--booked {
  color: #bbb;
  text-decoration: line-through;
  cursor: not-allowed;
}
```

- **Spinner view** — called once with the current time on every update (open + arrow scroll). Class and title are applied to all value buttons. Stale results from fast scrolling are automatically discarded.
- **Grid view** — called once per cell in parallel via `Promise.all`. Grid renders after all results arrive.

### Dark theme

```ts
new Timepicker('#night', {
  theme: 'dark',
})
```

### Programmatic API

```ts
const tp = new Timepicker('#tp')

await tp.setValue('09:30')
await tp.setNow()
await tp.clear()

const value = tp.getValue()   // "09:30"
const date  = tp.getDate()    // Date | null

await tp.open()
await tp.close()
await tp.toggle()

tp.destroy()
```

### Auto-init from HTML attributes

```html
<input data-timepicker data-timepicker-options='{"format":"HH:mm","showNowButton":true}' />
<input data-timepicker data-timepicker-options='{"format":"hh:mm a","locale":"en"}' />
```

```ts
const pickers = Timepicker.autoInit() // initialize all [data-timepicker] inputs
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `format` | `string` | `'HH:mm'` | Format tokens: `HH` (24h), `hh` (12h), `mm`, `ss`, `a`. |
| `locale` | `string \| LocaleConfig` | `'en'` | Built-in: `en`, `sk`, `cs`, `de`. Pass an object for custom. |
| `value` | `string \| Date \| null` | — | Initial value. |
| `defaultValue` | `string \| Date \| null` | — | Fallback initial value. |
| `minTime` | `string` | `''` | Earliest allowed time (`HH:mm`). |
| `maxTime` | `string` | `''` | Latest allowed time (`HH:mm`). |
| `minuteStep` | `number` | `5` | Spinner step for minutes. |
| `secondStep` | `number` | `1` | Spinner step for seconds. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Colour scheme. |
| `showNowButton` | `boolean` | `false` | Show "Now" button. |
| `showClearButton` | `boolean` | `false` | Show "Clear" button. |
| `showConfirmButton` | `boolean` | `false` | Show "Confirm" button. |
| `openOnFocus` | `boolean` | `true` | Open on input focus. |
| `closeOnSelect` | `boolean` | `true` | Close after selecting. |
| `allowManualInput` | `boolean` | `true` | Allow keyboard entry. |
| `parseStrategy` | `'right-fill' \| 'left-fill' \| 'smart'` | `'right-fill'` | How to interpret partial input. |
| `renderCell` | `(time: string) => CellRenderResult \| Promise<CellRenderResult>` | — | Async cell renderer. Return `{ clickable, className, title }` per cell. |
| `validate` | `(v: string) => boolean \| string \| Promise<...>` | — | Custom validation function. |
| `onBeforeOpen` | `() => boolean \| Promise<boolean>` | — | Guard before opening. |
| `onBeforeChange` | `(next, prev) => boolean \| Promise<boolean>` | — | Guard before value commit. |
| `onChange` | `(value, event) => void` | — | Fired when value changes. |
| `onInvalid` | `(err) => void` | — | Fired when value is rejected. |
| `onClose` | `(reason) => void` | — | Fired when dropdown closes. |

See the [full options reference](https://tito10047.github.io/vanilla-js-timepicker/guide/initialization) for all options.

---

## Events

The picker dispatches `CustomEvent`s on the `<input>` element for every lifecycle step:

| Event | Payload | Cancellable |
|---|---|---|
| `vtp:beforeopen` | `{}` | Yes |
| `vtp:open` | `{ view }` | No |
| `vtp:close` | `{ reason }` | No |
| `vtp:beforechange` | `{ next, prev }` | Yes |
| `vtp:change` | `{ value, date, prev }` | No |
| `vtp:input` | `{ raw }` | No |
| `vtp:invalid` | `{ code, message, value }` | No |
| `vtp:destroy` | `{}` | No |

```ts
input.addEventListener('vtp:change', (e) => {
  console.log((e as CustomEvent).detail.value)
})
```

---

## Theming

Override CSS custom properties to match your design system:

```css
:root {
  --vtp-accent: #e63946;
  --vtp-bg-selected: #e63946;
  --vtp-radius: 4px;
  --vtp-font: 'Inter', sans-serif;
}
```

Full list of variables: [Theming guide](https://tito10047.github.io/vanilla-js-timepicker/guide/theming).

---

## Keyboard navigation

| Key | Action |
|---|---|
| `ArrowUp / Down` | Increment / decrement the focused column |
| `Page Up / Down` | Large increment / decrement |
| `Home / End` | Jump to min / max value |
| `ArrowLeft / Right` | Move between columns |
| `Escape` | Close the dropdown |
| `Enter` | Confirm / autofill |

---

## Documentation

Full documentation: [https://tito10047.github.io/vanilla-js-timepicker/](https://tito10047.github.io/vanilla-js-timepicker/)

Live demo (8 interactive examples): [https://tito10047.github.io/vanilla-js-timepicker/demo/](https://tito10047.github.io/vanilla-js-timepicker/demo/)

- [Getting Started](https://tito10047.github.io/vanilla-js-timepicker/guide/getting-started)
- [Initialization & Options](https://tito10047.github.io/vanilla-js-timepicker/guide/initialization)
- [Public API](https://tito10047.github.io/vanilla-js-timepicker/guide/public-api)
- [Events](https://tito10047.github.io/vanilla-js-timepicker/guide/events)
- [Time Formats](https://tito10047.github.io/vanilla-js-timepicker/guide/formats)
- [Parse Strategies](https://tito10047.github.io/vanilla-js-timepicker/guide/parsing)
- [Theming & CSS Variables](https://tito10047.github.io/vanilla-js-timepicker/guide/theming)
- [Internationalization](https://tito10047.github.io/vanilla-js-timepicker/guide/i18n)
- [Accessibility](https://tito10047.github.io/vanilla-js-timepicker/guide/accessibility)
- [TypeScript](https://tito10047.github.io/vanilla-js-timepicker/guide/typescript)
- [Cookbook](https://tito10047.github.io/vanilla-js-timepicker/cookbook/)
  - [Cell Renderer](https://tito10047.github.io/vanilla-js-timepicker/cookbook/render-cell)

---

## License

MIT © 2026 tito10047
