import { InjectionToken } from '@angular/core';

const fallbackBaseUrl = 'http://localhost:8080';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => (globalThis as { __SECURE_LINK_API_BASE_URL__?: string }).__SECURE_LINK_API_BASE_URL__ ?? fallbackBaseUrl,
});
