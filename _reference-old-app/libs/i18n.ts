import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from '@/src/locales/pt-br';
import esMX from '@/src/locales/es-mx';
import enUS from '@/src/locales/en-us';
import { SUPPORTED_LOCALES } from '@/src/shared/constants/locale';

export const LANGUAGE_STORAGE_KEY = 'storyweaver:language';

const savedLanguage = (typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null) ?? 'pt-br';

i18n
  .use(initReactI18next)
  .init({
    lng: savedLanguage,
    fallbackLng: 'pt-br',
    supportedLngs: [...SUPPORTED_LOCALES],
    resources: {
      'pt-br': { translation: ptBR },
      'es-mx': { translation: esMX },
      'en-us': { translation: enUS },
    },
    interpolation: {
      escapeValue: false,
    },
    lowerCaseLng: true,
  });

export default i18n;
