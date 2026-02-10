import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  template: `
    <div class="toast toast-top toast-end z-[70]">
      @for (item of toastService.toasts(); track item.id) {
        <div class="alert" [class.alert-error]="item.kind === 'error'" [class.alert-success]="item.kind === 'success'" [class.alert-warning]="item.kind === 'warning'" [class.alert-info]="item.kind === 'info'">
          <div>
            <span class="font-semibold">{{ item.title }}</span>
            @if (item.message) {
              <span class="text-xs opacity-90">{{ item.message }}</span>
            }
          </div>
          <button class="btn btn-ghost btn-xs" type="button" (click)="toastService.dismiss(item.id)">
            <i class="ri-close-line"></i>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastOutletComponent {
  readonly toastService = inject(ToastService);
}
