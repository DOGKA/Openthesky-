import { createContext, useContext, useMemo, type ReactNode } from "react";
import { detectLocale, localeTag, makeT, type TFn } from "@/lib/i18n";
import type { SkyLocale } from "@/lib/sky/sky-data";

type LocaleCtx = { locale: SkyLocale; tag: string; t: TFn };

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const value = useMemo<LocaleCtx>(() => {
    const locale = detectLocale();
    return { locale, tag: localeTag(locale), t: makeT(locale) };
  }, []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
