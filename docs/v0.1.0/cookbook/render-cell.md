# Cell Renderer

The `renderCell` option lets you control how individual cells in the hour, minute, and second grid views look and behave. It is called **once per cell** when the grid opens, with the formatted time that the cell would commit if clicked.

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

## Basic: mark booked slots as non-clickable

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
