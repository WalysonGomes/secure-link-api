import { InjectionToken } from '@angular/core';

const runtimeApiBase = (globalThis as { __secureLinkApiBaseUrl?: string }).__secureLinkApiBaseUrl;

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => runtimeApiBase ?? 'http://localhost:8080'
});
