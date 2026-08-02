# Troubleshooting

## The dropdown does not appear when clicking the input

**Check 1 — CSS is imported.** The dropdown has no visible style without the stylesheet. Make sure you import it:

```ts
import '@tito10047/vanilla-js-timepicker/dist/timepicker.css'
```

Or via `<link>` in HTML:

```html
<link rel="stylesheet" href="/node_modules/@tito10047/vanilla-js-timepicker/dist/timepicker.css" />
```

**Check 2 — `z-index` conflict.** Another element on your page may be rendering on top of the dropdown. The default `z-index` is `1000`. Raise it:

```ts
new Timepicker('#tp', { zIndex: 9999 })
```

**Check 3 — overflow hidden on a parent.** If a parent element has `overflow: hidden`, the dropdown may be clipped. Either remove the overflow rule or use the `container` option to mount the dropdown outside the clipping ancestor:

```ts
new Timepicker('#tp', {
  container: document.body, // explicit, escapes the clipping parent
})
```

**Check 4 — `openOnFocus` is `false`.** If you set `openOnFocus: false`, clicking the input (which focuses it) will not open the picker. You must call `tp.open()` manually or use the toggle icon.

---

## The value is not updating when I call `setValue`

`setValue` is `async`. If you call it without `await`, any code immediately after it may run before the value is committed.

```ts
// Wrong — may log empty string
tp.setValue('14:30')
console.log(tp.getValue())

// Correct
await tp.setValue('14:30')
console.log(tp.getValue())  // "14:30"
```

---

## Manual typing does not update the value

By design, the input value is only committed (and `onChange` fired) when the user:
- selects a time from the dropdown,
- blurs the input (when `autofill: true`),
- presses `Enter`.

The `onInput` callback fires on every keystroke with the raw string, but it does not commit the value.

If you want the value committed on every keystroke, call `setValue` inside `onInput`:

```ts
new Timepicker('#tp', {
  onInput: async (raw) => {
    await tp.setValue(raw)
  },
})
```

---

## The picker throws "element not found"

The CSS selector you passed to the constructor did not match any element at the time the constructor ran. Common causes:

- The script runs before the DOM is ready. Wrap in `DOMContentLoaded`:

```ts
document.addEventListener('DOMContentLoaded', () => {
  new Timepicker('#tp', { ... })
})
```

- The input is rendered dynamically (by a framework) after the initial page load. Initialize the picker inside the component's mount hook, not at module level.

---

## `onChange` fires but `getDate()` returns `null`

`getDate()` returns `null` when the current value string cannot be parsed. This can happen if:

- The `format` option does not match the value format (e.g. `format: 'HH:mm'` but the value is `'14:30:00'`).
- The value was set directly on `input.value` without going through `setValue`. Always use `tp.setValue()`.

---

## `validate` returns a string but the picker still closes

`validate` is only called during `setValue` (programmatic or from the picker UI). If `closeOnSelect: true` (default), the picker closes when the user picks a time, and then `setValue` runs validation. If validation rejects the value, the `vtp:invalid` event fires and the input shows the `vtp-invalid` class — but the dropdown is already closed.

To keep the dropdown open on validation failure, set `closeOnSelect: false` and `showConfirmButton: true`. The user then clicks Confirm to trigger validation, and the dropdown only closes when validation passes.

```ts
new Timepicker('#tp', {
  showConfirmButton: true,
  closeOnSelect: false,
  validate: async (v) => {
    const ok = await checkServer(v)
    return ok || 'This slot is taken'
  },
})
```

---

## The picker does not clean up after a React unmount / Angular destroy

Call `tp.destroy()` in the component's teardown hook:

```ts
// React useEffect
useEffect(() => {
  const tp = new Timepicker('#tp', options)
  return () => tp.destroy()
}, [])

// Vue onUnmounted
onUnmounted(() => tp.destroy())

// Angular ngOnDestroy
ngOnDestroy() { this.tp.destroy() }
```

---

## `Timepicker.autoInit()` returns an empty array

`autoInit()` uses `[data-timepicker]` as the default selector. Make sure:

1. Your `<input>` elements have the `data-timepicker` attribute (no value needed).
2. You call `autoInit()` after the DOM is ready.

```html
<input data-timepicker type="text" />
```

```ts
document.addEventListener('DOMContentLoaded', () => {
  Timepicker.autoInit()
})
```

---

## Dark theme does not activate on my system

The `'auto'` theme reads `prefers-color-scheme: dark` from the system. If your browser or OS is in light mode, the auto theme shows the light palette.

To force dark mode in development, override the CSS variable at `:root`:

```css
:root {
  color-scheme: dark;
}
```

Or use the `theme: 'dark'` option directly.
