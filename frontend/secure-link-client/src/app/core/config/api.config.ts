import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const globalConfig = (window as Window & { __APP_CONFIG__?: { apiBaseUrl?: string } }).__APP_CONFIG__;
    return globalConfig?.apiBaseUrl ?? 'http://localhost:8080';
  }
});
