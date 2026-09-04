import { routing } from "@/i18n/routing";

// Canonical + hreflang pentru o cale dată, ca obiect `alternates` de pus în
// metadata. Căile sunt relative la metadataBase (root layout). localePrefix e
// "as-needed": locale-ul default (en) nu are prefix, celelalte da — deci
// canonicalul trebuie să oglindească exact rutarea, nu să prefixeze uniform.
export function localeAlternates(locale: string, path: string) {
  const href = (l: string) => (l === routing.defaultLocale ? path || "/" : `/${l}${path}`);
  return {
    canonical: href(locale),
    languages: Object.fromEntries([
      ...routing.locales.map((l) => [l, href(l)]),
      ["x-default", href(routing.defaultLocale)],
    ]) as Record<string, string>,
  };
}
