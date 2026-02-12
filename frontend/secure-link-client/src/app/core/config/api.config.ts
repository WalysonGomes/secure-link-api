import { InjectionToken } from '@angular/core';

const runtimeEnv = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env;

function normalizeBaseUrl(value?: string): string {
  const fallback = 'http://localhost:8080/';
  const configured = value?.trim();

  if (!configured) {
    return fallback;
  }

  return configured.endsWith('/') ? configured : `${configured}/`;
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => normalizeBaseUrl(runtimeEnv?.['NG_APP_API_BASE_URL'] ?? runtimeEnv?.['API_BASE_URL'])
});
