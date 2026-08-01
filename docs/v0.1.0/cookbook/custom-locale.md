# Custom Locale

This recipe shows how to add a locale that is not shipped with the library and make it available across the whole application.

## Step 1 — define the locale object

```ts
// src/locales/fr.ts
import type { LocaleConfig } from 'vanilla-js-timepicker'

export const fr: LocaleConfig = {
  title: "Choisir l'heure",
  hoursLabel: 'Heures',
  minutesLabel: 'Minutes',
  secondsLabel: 'Secondes',
  amLabel: 'AM',
  pmLabel: 'PM',
  nowLabel: 'Maintenant',
  clearLabel: 'Effacer',
  confirmLabel: 'Confirmer',
}
```

## Step 2 — register it at application startup

```ts
// src/main.ts
import { registerLocale, Timepicker } from 'vanilla-js-timepicker'
import { fr } from './locales/fr'

registerLocale('fr', fr)

// Optional: set as the global default
Timepicker.setDefaults({ locale: 'fr' })
```

After this, any picker on the page can use `locale: 'fr'`.

## Step 3 — use in a picker

```ts
// All three forms are equivalent after registration:

new Timepicker('#tp1', { locale: 'fr' })           // string key

new Timepicker('#tp2')                              // falls through to global default

new Timepicker('#tp3', { locale: fr })             // direct object (no registration needed)
```

## Loading from a JSON file

```ts
// locales/pt.json
{
  "title": "Escolher hora",
  "hoursLabel": "Horas",
  "minutesLabel": "Minutos",
  "secondsLabel": "Segundos",
  "amLabel": "AM",
  "pmLabel": "PM",
  "nowLabel": "Agora",
  "clearLabel": "Limpar",
  "confirmLabel": "Confirmar"
}
```

```ts
import ptLocale from './locales/pt.json'
import type { LocaleConfig } from 'vanilla-js-timepicker'

registerLocale('pt', ptLocale as LocaleConfig)
```

## Loading a locale on demand (lazy)

If you only need a locale when a user switches language settings, register it lazily:

```ts
async function switchLanguage(lang: string) {
  if (lang === 'ja') {
    const { ja } = await import('./locales/ja')
    registerLocale('ja', ja)
  }
  Timepicker.setDefaults({ locale: lang })
  // Re-initialize open pickers or update existing instances:
  tp.setOptions({ locale: lang })
}
```

## Overriding a single string in a built-in locale

If you only want to change one label (e.g. the Confirm button text), spread the built-in locale:

```ts
import { registerLocale } from 'vanilla-js-timepicker'

// Import the built-in en locale strings manually
const enCustom = {
  title: 'Pick a time',
  hoursLabel: 'Hours',
  minutesLabel: 'Minutes',
  secondsLabel: 'Seconds',
  amLabel: 'AM',
  pmLabel: 'PM',
  nowLabel: 'Current time',  // renamed
  clearLabel: 'Reset',       // renamed
  confirmLabel: 'Apply',     // renamed
}

registerLocale('en-custom', enCustom)
Timepicker.setDefaults({ locale: 'en-custom' })
```
