# Cell Renderer

The `renderCell` option lets you control how individual time elements look and behave in **both** the spinner (picker) view and the grid views.

- **Spinner view** — the clickable time value buttons (e.g. the `"09"` and `"30"` you click to open the grid) receive the class and title for the **currently displayed time**.
- **Grid view** — each selectable cell receives the class and title for the time **it would commit** if clicked.

It is called asynchronously and can return a `Promise`, so you can fetch availability from a server before rendering.

## How it works in each view

### Spinner (picker) view
When you open the picker and use the up/down arrows, `renderCell` is called once with the full formatted time each time `update()` is triggered. The result's `className` and `title` are applied to **all three value buttons** (`"09"`, `"30"`, `"45"`). This lets you signal that the currently selected time is occupied/invalid without switching to the grid.

Race condition is handled automatically: if the user scrolls through times faster than `renderCell` resolves, only the result of the **last** call is applied. Stale results are silently discarded.

### Grid view
When the user clicks a value button to open the grid, `renderCell` is called once **per cell** (in parallel via `Promise.all`) with the time that cell would produce. The grid is rendered only after all calls resolve, so users see the final state immediately — no flickering.

## Signature

```ts
interface CellRenderResult {
  className?: string | string[]  // CSS class(es) to add to the cell element
  clickable?: boolean            // false = cell is greyed out and non-clickable (default: true)
  title?: string                 // tooltip / aria-label override for the cell
}

type CellRenderer = (time: string) => CellRenderResult | Promise<CellRenderResult>
```

The function receives a string in the active `format` (e.g. `"14:30"`, `"09:00 AM"`, `"14:30:00"`), where the non-candidate parts (hours when rendering the minutes grid, etc.) are taken from the current picker state.

## Spinner view: style the displayed time

When the user scrolls arrows, the value buttons (`"09"`, `"30"`) update in real time. `renderCell` is called after each update with the full current time and its result is applied to all value buttons.

```ts
new Timepicker('#appointment', {
  format: 'HH:mm',
  renderCell: async (time) => {
    const busy = await checkBusy(time)
    return {
      className: busy ? 'slot-busy' : undefined,
      title: busy ? `${time} is occupied` : time,
    }
  },
})
```

```css
.slot-busy {
  color: #bbb;
  text-decoration: line-through;
}
```

The value buttons immediately show `"09"` and `"30"` (sync), and then the class/title arrives asynchronously when the promise resolves. Stale results from rapid scrolling are automatically discarded.

## Grid view: mark booked slots as non-clickable

```ts
const bookedSlots = new Set(['09:00', '11:00', '14:30', '16:00'])

new Timepicker('#appointment', {
  format: 'HH:mm',
  minuteStep: 30,
  renderCell: (time) => ({
    clickable: !bookedSlots.has(time),
    className: bookedSlots.has(time) ? 'vtp-cell--booked' : undefined,
    title: bookedSlots.has(time) ? `${time} is already booked` : time,
  }),
})
```

```css
/* Your stylesheet */
.vtp-cell--booked {
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0,0,0,.06) 4px,
    rgba(0,0,0,.06) 8px
  );
  color: #bbb;
  text-decoration: line-through;
  cursor: not-allowed;
}
```

## Async: fetch availability from the server

```ts
new Timepicker('#slot', {
  format: 'HH:mm',
  minuteStep: 15,
  renderCell: async (time) => {
    const res = await fetch(`/api/availability?time=${encodeURIComponent(time)}`)
    const { available, label } = await res.json()
    return {
      clickable: available,
      className: available ? 'vtp-cell--free' : 'vtp-cell--taken',
      title: label ?? time,
    }
  },
})
```

> The grid is shown immediately while cell data loads — the `Promise.all` for all cells in the view resolves before the grid is rendered, so users see the final state at once rather than cells changing one by one.

## Multiple classes

```ts
renderCell: (time) => {
  const h = parseInt(time.split(':')[0], 10)
  const isPeak = h >= 8 && h <= 10
  return {
    className: ['my-cell', isPeak ? 'my-cell--peak' : 'my-cell--off-peak'],
    title: isPeak ? `${time} (peak hours)` : time,
  }
}
```

## Combining with `minTime` / `maxTime`

`renderCell` and `minTime`/`maxTime` work independently. A cell blocked by `minTime`/`maxTime` is always non-clickable regardless of what `renderCell` returns. You can use `renderCell` to add visual indicators on top of the range restriction:

```ts
new Timepicker('#tp', {
  minTime: '08:00',
  maxTime: '17:00',
  renderCell: async (time) => {
    const busy = await checkBusy(time)
    return {
      clickable: !busy,
      className: busy ? 'cell-busy' : undefined,
      title: busy ? `${time} – occupied` : time,
    }
  },
})
```

## What time string is passed per grid view

| Grid view | `time` value example |
|---|---|
| Hours grid | `"09:30"` — candidate hour + current minute (and second if active) |
| Minutes grid | `"14:30"` — current hour + candidate minute |
| Seconds grid | `"14:30:45"` — current hour + current minute + candidate second |

## TypeScript

Import the types to annotate your renderer:

```ts
import type { CellRenderer, CellRenderResult } from 'vanilla-js-timepicker'

const renderer: CellRenderer = async (time): Promise<CellRenderResult> => {
  const busy = await checkBusy(time)
  return { clickable: !busy, className: busy ? 'busy' : undefined }
}

new Timepicker('#tp', { renderCell: renderer })
```
