---
layout: home

hero:
  name: "vanilla-js-timepicker"
  text: "A time picker with zero dependencies."
  tagline: "One constructor call, a fully accessible dropdown, keyboard navigation, async validation, and CSS-variable theming — all in under 10 kB."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Live Demo
      link: https://tito10047.github.io/vanilla-js-timepicker/demo/
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/tito10047/vanilla-js-timepicker

features:
  - title: Zero dependencies
    details: "No jQuery, no Moment, no framework. Drop it into any project — vanilla JS, Vue, React, Svelte, or a plain HTML page."
  - title: TypeScript first
    details: "Written in TypeScript from the ground up. Every option, event, and return type is fully typed and exported."
  - title: 24h · 12h · seconds
    details: "<code>HH:mm</code>, <code>hh:mm a</code>, <code>HH:mm:ss</code> — one <code>format</code> string covers all layouts. AM/PM toggle renders automatically."
  - title: Async lifecycle hooks
    details: "<code>onBeforeOpen</code>, <code>onBeforeChange</code>, and <code>validate</code> accept Promises. Block the picker, run an API call, return an error message."
  - title: Fully accessible
    details: "ARIA <code>combobox</code> on the input, <code>dialog</code> on the dropdown, <code>spinbutton</code> per column. Full keyboard navigation — arrows, Page Up/Down, Home, End, Escape."
  - title: CSS-variable theming
    details: "Light, dark, and auto (system preference) themes out of the box. Override any of the 20+ CSS custom properties to match your design system."
---

## A complete example, start to finish

```ts
import { Timepicker } from 'vanilla-js-timepicker'
import 'vanilla-js-timepicker/dist/timepicker.css'

const tp = new Timepicker('#departure', {
  format: 'HH:mm',
  minTime: '06:00',
  maxTime: '22:00',
  minuteStep: 15,
  showNowButton: true,
  showClearButton: true,
  locale: 'en',
  validate: async (value) => {
    const reserved = await fetchReservedTimes()
    return reserved.includes(value) ? `${value} is already reserved` : true
  },
  onChange: (value, event) => {
    console.log('Selected:', value, '| Previous:', event.prev)
  },
})

// Programmatic control
await tp.setValue('09:00')
console.log(tp.getValue())   // '09:00'
console.log(tp.getDate())    // Date object at 09:00

await tp.open()
await tp.close()
tp.destroy()
```

That is the whole integration: no Application, no imports beyond the class and CSS.

Ready? Continue with [Getting Started](/guide/getting-started).
