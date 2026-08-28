import { SupportedLocale } from '@/shared/constants/locale';

// Espelha o envelope obrigatório de toda resposta da API — ver
// `.claude/rules/api-response-format.md`. `message` é sempre um objeto i18n com
// as três localidades, nunca uma string simples.
export type ApiMessage = Record<SupportedLocale, string>;

export type PayloadBody<T extends FormData | object> = {
  body: T;
};

export type PayloadQuery<T extends object> = {
  query?: T;
};
