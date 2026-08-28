export const SUPPORTED_LOCALES = ['pt-br', 'es-mx', 'en-us'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
