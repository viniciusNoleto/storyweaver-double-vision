import { ofetch } from 'ofetch';
import { ApiMessage } from '@/shared/types/api';

// Cliente HTTP fino sobre `ofetch`, mesmo padrão de `utils/app-client.ts` do
// projeto de referência (`cross-poker`). Toda resposta da API já vem no
// envelope `{ success, message, data }` (ver `.claude/rules/api-response-format.md`)
// — este client só tipa esse envelope, não desembrulha `data` (isso fica a
// cargo de quem consome o service, ex. `resources/table/hooks/useTableStream.ts`).
export type AppApiResponse<T> = {
  success: boolean;
  message: ApiMessage;
  data: T;
};

type Options = NonNullable<Parameters<typeof ofetch>[1]>;

async function request<T>(url: string, options?: Options): Promise<AppApiResponse<T>> {
  return await ofetch<AppApiResponse<T>>(url, options);
}

export const appClient = {
  get<T>(url: string, options?: Options): Promise<AppApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'GET',
    });
  },
  post<T>(url: string, options: Options): Promise<AppApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'POST',
    });
  },
  put<T>(url: string, options: Options): Promise<AppApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'PUT',
    });
  },
  patch<T>(url: string, options: Options): Promise<AppApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'PATCH',
    });
  },
  delete<T>(url: string, options?: Options): Promise<AppApiResponse<T>> {
    return request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  },
};
