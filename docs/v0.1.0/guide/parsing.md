# Parse Strategies

When a user types into the input manually, the picker must infer a `{ h, m, s }` triple from a raw string like `"930"` or `"1430"`. The `parseStrategy` option selects the algorithm.

## Why strategies exist

There is no single "correct" interpretation of partial input. Consider `"9"` — does the user mean:
- `09:00` (hour 9, minute 0)?
- a partially-typed `09:XX` that should not be committed yet?

Different applications have different UX expectations. The three strategies cover the most common cases.

## `right-fill` (default)

Digits are read **right-to-left**: the last two digits are minutes, the two before that are hours.

In other words, the raw digit string is **right-aligned** into a `HHMM` (or `HHMMSS`) field.

| Input typed | Parsed as |
|---|---|
| `"9"` | `00:09` |
| `"30"` | `00:30` |
| `"930"` | `09:30` |
| `"1430"` | `14:30` |
| `"143045"` (with seconds) | `14:30:45` |

**Best for:** numeric keypads, mobile entry, forms where users habitually omit leading zeros.

```ts
new Timepicker('#tp', { parseStrategy: 'right-fill' })

// "930" → state: { h: 9, m: 30, s: 0 } → displayed: "09:30"
```

## `left-fill`

Digits are read **left-to-right**: the first 1-2 digits are hours, the next two are minutes, the next two (if seconds are active) are seconds.

| Input typed | Parsed as |
|---|---|
| `"9"` | `09:00` |
| `"14"` | `14:00` |
| `"930"` | `09:30` |
| `"1430"` | `14:30` |
| `"9:30"` (colon stripped) | `09:30` |

**Best for:** standard keyboard entry where users type hours first and expect natural left-to-right reading.

```ts
new Timepicker('#tp', { parseStrategy: 'left-fill' })

// "14" → state: { h: 14, m: 0, s: 0 } → displayed: "14:00"
```

## `smart`

`smart` is currently an alias for `left-fill`. It is reserved for a future heuristic that combines both strategies based on input length and digit patterns.

```ts
new Timepicker('#tp', { parseStrategy: 'smart' })
```

## Autofill on blur

When `autofill: true` (the default), the picker re-parses the raw input value on `blur` and normalises it:

```
User types: "930" → blurs → input shows "09:30" → onChange fires
```

Disable this if you want the raw string to remain unchanged until the user confirms:

```ts
new Timepicker('#tp', { autofill: false })
```

## Using parse functions standalone

All three parse functions are exported:

```ts
import { parseRightFill, parseLeftFill, parseSmart, parseAny } from '@tito10047/vanilla-js-timepicker'

parseRightFill('930',  { hasSeconds: false })  // { h: 9, m: 30, s: 0 }
parseLeftFill('930',   { hasSeconds: false })  // { h: 9, m: 30, s: 0 }
parseSmart('930',      { hasSeconds: false })  // { h: 9, m: 30, s: 0 }

// parseAny lets you pass the strategy as a string parameter
parseAny('930', { hasSeconds: false }, 'right-fill')  // { h: 9, m: 30, s: 0 }
parseAny('invalid', { hasSeconds: false })            // null
```

Return value is `ParsedTime | null`:

```ts
interface ParsedTime {
  h: number  // 0–23
  m: number  // 0–59
  s: number  // 0–59
}
```

`null` is returned when the input contains no digit characters or produces an out-of-range value (e.g. hour > 23).

## Using `Timepicker.parse()` for formatted output

The static `Timepicker.parse()` method wraps the parse functions and returns a formatted string:

```ts
Timepicker.parse('930')                                     // "09:30"
Timepicker.parse('930', { strategy: 'left-fill' })          // "09:30"
Timepicker.parse('93045', { hasSeconds: true })             // "09:30:45"
Timepicker.parse('invalid')                                 // null
```
