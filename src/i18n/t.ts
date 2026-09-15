import type { Locale } from "./locale";
import { en, type MessageKey, type Messages } from "./messages/en";
import { de } from "./messages/de";
import { es } from "./messages/es";
import { tr } from "./messages/tr";

export type StringKey = MessageKey;
export type TFn = (key: StringKey, vars?: Record<string, string | number>) => string;

const TABLES: Record<Locale, Messages> = { en, tr, de, es };

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(`{${key}}`, String(value));
  }
  return out;
}

export function makeT(locale: Locale): TFn {
  const table = TABLES[locale];
  return (key, vars) => interpolate(table[key] ?? en[key] ?? key, vars);
}
