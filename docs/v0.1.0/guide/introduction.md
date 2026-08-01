# Introduction

`vanilla-js-timepicker` is a lightweight, dependency-free time picker component for the web. It attaches to any `<input>` element and provides a dropdown UI for selecting hours, minutes, and (optionally) seconds.

## The problem

A native `<input type="time">` exists, but its appearance is browser-controlled and virtually unthemable. Cross-browser behaviour is inconsistent: Chrome renders a spinner, Firefox renders an inline clock, and Safari renders a plain text box in some versions. Rolling your own time input means:

```html
<!-- You get the browser's design. No control over layout, colours, or interaction. -->
<input type="time" />
```

Common workarounds — splitting into separate hour/minute fields, using a full-blown date library, or pulling in a date-range picker — all add either UX friction or multi-megabyte dependencies.

## The solution

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'

new Timepicker('#departure', {
  format: 'HH:mm',
  minuteStep: 15,
  showNowButton: true,
  onChange: (value) => console.log('Selected:', value),
})
```

What you get with one constructor call:

- A spinner-based picker column for each time unit.
- A grid view for directly tapping an hour, minute, or second.
- Keyboard navigation (Arrow keys, Page Up/Down, Home, End, Escape, Enter).
- ARIA roles that screen readers understand.
- Light and dark themes driven by CSS custom properties.
- An optional "Now" button, "Clear" button, and explicit "Confirm" button.
- Async validation with human-readable error messages.
- Strict min/max clamping.

## Design principles

- **No framework coupling.** The library ships ES module, CommonJS, and UMD builds. It works in React, Vue, Svelte, Angular, or a bare HTML page without any adapter.
- **Opt-in complexity.** Defaults are sensible. You do not touch `validate`, `onBeforeOpen`, or `parseStrategy` unless you need them.
- **CSS variables, not inline styles.** Every colour, radius, shadow, and font is a CSS custom property. Override a single property anywhere in your stylesheet — no `!important`, no class fighting.
- **Events on the element.** Every lifecycle event fires both as a callback option (e.g. `onChange`) and as a native `CustomEvent` on the input element. Frameworks that listen to DOM events work out of the box.
- **Async-friendly lifecycle.** `open()`, `close()`, and `setValue()` are all async. Guards (`onBeforeOpen`, `onBeforeChange`, `validate`) accept Promises — call an API, check a server, return a result.

## What this library is not

- It is **not a date picker**. It picks time only. For calendar integration, use a separate date picker and combine the values in your application logic.
- It is **not a full UI framework component**. There is no React component export, no Vue plugin. It is a plain class you `new`-up on a DOM element.
- It is **not server-side-renderable** out of the box. The dropdown is created by JavaScript at open time. The `<input>` itself renders fine on the server; the picker UI requires a browser.

Next: [Getting Started](./getting-started.md).
