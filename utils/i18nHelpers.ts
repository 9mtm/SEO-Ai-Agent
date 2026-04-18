// Client-safe i18n helpers (no fs/path imports)
export const SUPPORTED_LOCALES = ['en','de','fr','es','it','pt','zh','nl','tr','ar','ja'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export function tStatic(messages: Record<string, any>, key: string, vars: Record<string, any> = {}): string {
  const parts = key.split('.');
  let value: any = messages;
  for (const p of parts) {
    if (value && typeof value === 'object' && p in value) value = value[p];
    else return key;
  }
  if (typeof value !== 'string') return key;
  for (const v of Object.keys(vars)) {
    value = value.replace(new RegExp(`{{${v}}}`, 'g'), String(vars[v]));
  }
  return value;
}

export function buildHreflangs(pathSuffix: string = '/') {
  const base = 'https://seo-agent.net';
  const suffix = pathSuffix === '/' ? '/' : pathSuffix;
  return [
    ...SUPPORTED_LOCALES.map(loc => ({
      hrefLang: loc,
      href: loc === 'en' ? `${base}${suffix}` : `${base}/${loc}${suffix === '/' ? '/' : suffix}`
    })),
    { hrefLang: 'x-default', href: `${base}${suffix}` }
  ];
}

export const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_US', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', it: 'it_IT',
  pt: 'pt_BR', zh: 'zh_CN', nl: 'nl_NL', tr: 'tr_TR', ar: 'ar_AR', ja: 'ja_JP',
};
