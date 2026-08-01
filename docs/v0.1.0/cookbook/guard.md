# Before-open / Before-change Guards

Guards let you intercept the picker's lifecycle and cancel actions asynchronously. They are the right tool when you need to check external state (server, form validation, user confirmation) before the picker opens or a value is committed.

## `onBeforeOpen` — prevent the dropdown from opening

```ts
new Timepicker('#tp', {
  onBeforeOpen: () => {
    // return false to block opening
    return document.getElementById('lock-checkbox')!.checked === false
  },
})
```

Async guard — block opening until a server confirms the field is editable:

```ts
new Timepicker('#tp', {
  onBeforeOpen: async () => {
    const { editable } = await fetch('/api/field-status').then(r => r.json())
    if (!editable) showToast('This field is locked by another user')
    return editable
  },
})
```

### DOM event equivalent

Listen for the cancellable `vtp:beforeopen` event on the input:

```ts
input.addEventListener('vtp:beforeopen', (e) => {
  if (!canEdit()) {
    e.preventDefault()
    showError('Form is in read-only mode')
  }
})
```

---

## `onBeforeChange` — prevent a value from being committed

The guard receives both the new (`next`) and previous (`prev`) value. Return `false` to abort.

```ts
new Timepicker('#departure', {
  onBeforeChange: (next, prev) => {
    // Block changes during business hours
    const now = new Date()
    const isBusinessHours = now.getHours() >= 9 && now.getHours() < 17
    if (isBusinessHours) {
      showToast('Changes are not allowed during business hours')
      return false
    }
    return true
  },
})
```

Async guard — confirm with the user before overwriting a reservation:

```ts
new Timepicker('#slot', {
  onBeforeChange: async (next, prev) => {
    if (!prev) return true  // nothing to overwrite
    const confirmed = await showConfirmDialog(
      `Replace ${prev} with ${next}?`
    )
    return confirmed
  },
})
```

### DOM event equivalent

```ts
input.addEventListener('vtp:beforechange', (e) => {
  const { next, prev } = (e as CustomEvent).detail
  if (someCondition(next, prev)) {
    e.preventDefault()
  }
})
```

---

## Combining multiple guards

You can use both `onBeforeOpen` and `onBeforeChange` on the same picker:

```ts
new Timepicker('#meeting', {
  onBeforeOpen: async () => {
    return await checkPermission('can_edit_meeting')
  },
  onBeforeChange: async (next) => {
    return await checkSlotAvailable(next)
  },
  validate: (v) => {
    const [h] = v.split(':').map(Number)
    return h >= 8 && h <= 20
      ? true
      : 'Please select a time between 08:00 and 20:00'
  },
})
```

The execution order for a value change is:

1. `onBeforeChange` (guard — runs first, can cancel without side effects).
2. `vtp:beforechange` DOM event (cancellable).
3. `validate` (validation — runs if guards passed).
4. Value is committed, `vtp:change` fires.

---

## Difference between `onBeforeChange` and `validate`

| | `onBeforeChange` | `validate` |
|---|---|---|
| Receives | `(next, prev)` — both old and new value | `(value)` — new value only |
| Purpose | Access control, confirmation dialogs | Data validation, business rules |
| Error message | No — only returns `true`/`false` | Yes — return a string for the message |
| Fires `vtp:invalid` | No | Yes |
| Adds `vtp-invalid` class | No | Yes |

Use `onBeforeChange` for access control. Use `validate` for time-value rules.
