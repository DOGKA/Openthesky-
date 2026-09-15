import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { detectLocale, localeTag, makeT, type Locale, type TFn } from "@/i18n";

type LocaleCtx = {
  locale: Locale;
  tag: string;
  t: TFn;
  setLocale: (locale: Locale) => void;
};

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const value = useMemo<LocaleCtx>(
    () => ({ locale, tag: localeTag(locale), t: makeT(locale), setLocale }),
    [locale, setLocale]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
