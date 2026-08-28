// Stub declarations for packages not yet installed
// Replace with real packages: npm install ofetch js-cookie @types/js-cookie

declare module 'ofetch' {
  export type FetchOptions = Omit<RequestInit, 'headers' | 'body'> & {
    baseURL?: string;
    params?: Record<string, any>;
    body?: any;
    headers?: HeadersInit | Record<string, string>;
    onResponse?: (ctx: any) => void;
    onResponseError?: (ctx: any) => void;
    [key: string]: any;
  };

  export function ofetch<T = any>(url: string, options?: FetchOptions): Promise<T>;
  export default ofetch;
}

declare module 'js-cookie' {
  const Cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: { expires?: number; sameSite?: string }): void;
    remove(name: string): void;
  };
  export default Cookies;
}
