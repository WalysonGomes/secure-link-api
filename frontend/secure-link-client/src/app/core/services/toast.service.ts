import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: number;
  kind: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);
  private nextId = 1;

  show(toast: Omit<ToastItem, 'id'>, timeoutMs = 5000): void {
    const item: ToastItem = { id: this.nextId++, ...toast };
    this.toasts.update((items) => [...items, item]);

    setTimeout(() => this.dismiss(item.id), timeoutMs);
  }

  dismiss(id: number): void {
    this.toasts.update((items) => items.filter((item) => item.id !== id));
  }
}
