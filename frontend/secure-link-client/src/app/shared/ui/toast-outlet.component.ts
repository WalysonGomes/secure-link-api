import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  template: `
    <div class="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[92vw] max-w-sm flex-col gap-2">
      @for (item of toastService.toasts(); track item.id) {
        <div
          class="pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md"
          [class.border-red-500/30]="item.kind === 'error'"
          [class.bg-red-500/10]="item.kind === 'error'"
          [class.text-red-200]="item.kind === 'error'"
          [class.border-emerald-500/30]="item.kind === 'success'"
          [class.bg-emerald-500/10]="item.kind === 'success'"
          [class.text-emerald-200]="item.kind === 'success'"
          [class.border-amber-500/30]="item.kind === 'warning'"
          [class.bg-amber-500/10]="item.kind === 'warning'"
          [class.text-amber-200]="item.kind === 'warning'"
          [class.border-indigo-500/30]="item.kind === 'info'"
          [class.bg-indigo-500/10]="item.kind === 'info'"
          [class.text-indigo-200]="item.kind === 'info'"
        >
          <div class="flex items-start gap-3">
            <i
              class="mt-0.5 text-lg"
              [class.ri-error-warning-fill]="item.kind === 'error'"
              [class.ri-checkbox-circle-fill]="item.kind === 'success'"
              [class.ri-alert-fill]="item.kind === 'warning'"
              [class.ri-information-fill]="item.kind === 'info'"
            ></i>

            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] opacity-80">{{ item.title }}</p>
              @if (item.message) {
                <p class="mt-0.5 text-sm text-zinc-100">{{ item.message }}</p>
              }
            </div>

            <button
              class="btn btn-ghost btn-xs text-zinc-300 hover:bg-white/10"
              type="button"
              (click)="toastService.dismiss(item.id)"
            >
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastOutletComponent {
  readonly toastService = inject(ToastService);
}
