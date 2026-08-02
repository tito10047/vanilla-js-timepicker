# Time Formats

The `format` option controls both how the selected time is displayed in the input and how the picker's internal state is converted to a string when firing `onChange`.

## Format tokens

| Token | Meaning | Example output |
|---|---|---|
| `HH` | Hours, 24-hour clock, zero-padded | `00`–`23` |
| `hh` | Hours, 12-hour clock, zero-padded | `01`–`12` |
| `mm` | Minutes, zero-padded | `00`–`59` |
| `ss` | Seconds, zero-padded | `00`–`59` |
| `a` | AM/PM suffix (upper-case) | `AM` or `PM` |

Tokens must appear as whole words or adjacent to non-alpha characters. Any other characters in the format string are kept verbatim.

## Supported format strings

### 24-hour, no seconds (default)

```ts
new Timepicker('#tp', { format: 'HH:mm' })
// → "09:30", "14:00", "23:59"
```

### 12-hour with AM/PM

```ts
new Timepicker('#tp', { format: 'hh:mm a' })
// → "09:30 AM", "02:00 PM"
```

The picker renders an **AM / PM toggle** below the spinner columns automatically when `hh` is in the format string.

### 24-hour with seconds

```ts
new Timepicker('#tp', { format: 'HH:mm:ss' })
// → "09:30:00", "14:30:45"
```

The picker renders a **third spinner column** for seconds automatically.

### 12-hour with seconds

```ts
new Timepicker('#tp', { format: 'hh:mm:ss a' })
// → "09:30:00 AM"
```

## Custom separators

The separator between tokens is not restricted to `:`. You can use any string:

```ts
new Timepicker('#tp', { format: 'HH.mm' })   // "14.30"
new Timepicker('#tp', { format: 'HH h mm'  }) // "14 h 30"
```

> **Warning:** The parse strategies strip all non-digit characters before interpreting the input. An unusual separator does not affect parsing — the digits are extracted regardless.

## How format affects the picker UI

The format string is tokenized at construction time by the internal `tokenize()` function:

```ts
tokenize('HH:mm:ss')
// → { hasHours: true, hasMinutes: true, hasSeconds: true, is12h: false }

tokenize('hh:mm a')
// → { hasHours: true, hasMinutes: true, hasSeconds: false, is12h: true }
```

Based on these flags the picker:

- Renders a **seconds column** only when `hasSeconds` is `true`.
- Renders an **AM/PM toggle** only when `is12h` is `true`.
- Converts the internal 24-hour state to 12-hour display when the format is 12-hour.

## `minTime` and `maxTime` with 12-hour formats

`minTime` and `maxTime` are **always compared in `HH:mm` (24-hour) notation**, regardless of the display format. This keeps range checks unambiguous:

```ts
new Timepicker('#tp', {
  format: 'hh:mm a',
  minTime: '08:00',   // 8 AM
  maxTime: '20:00',   // 8 PM
})
```

## Using `Timepicker.format()` standalone

You can format any `Date` object without creating a picker:

```ts
import { Timepicker } from '@tito10047/vanilla-js-timepicker'

Timepicker.format(new Date(), 'HH:mm')     // "14:30"
Timepicker.format(new Date(), 'hh:mm a')   // "02:30 PM"
Timepicker.format(new Date(), 'HH:mm:ss')  // "14:30:22"
```

## Exporting `formatTime` and `tokenize` directly

If you need lower-level access, both utilities are exported from the package:

```ts
import { formatTime, tokenize } from '@tito10047/vanilla-js-timepicker'

const tokens = tokenize('hh:mm a')  // FormatTokens
const str = formatTime({ h: 14, m: 30, s: 0 }, 'HH:mm')  // "14:30"
```
