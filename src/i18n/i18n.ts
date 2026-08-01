import type { LocaleConfig } from '../core/types';
import { en } from './locales/en';
import { sk } from './locales/sk';
import { cs } from './locales/cs';
import { de } from './locales/de';

const builtins: Record<string, LocaleConfig> = { en, sk, cs, de };
const custom: Record<string, LocaleConfig> = {};

export function registerLocale(name: string, config: LocaleConfig): void {
  custom[name] = config;
}

export function resolveLocale(locale: string | LocaleConfig | undefined): LocaleConfig {
  if (!locale) return en;
  if (typeof locale === 'object') return locale;
  return custom[locale] ?? builtins[locale] ?? en;
}
