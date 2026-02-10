import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="card border border-base-300 bg-base-100/70 shadow-sm backdrop-blur">
      <div class="card-body gap-2">
        <p class="text-xs uppercase tracking-[0.18em] text-base-content/60">{{ label() }}</p>
        <p class="text-3xl font-semibold">{{ value() }}</p>
        @if (hint()) {
          <p class="text-xs text-base-content/60">{{ hint() }}</p>
        }
      </div>
    </div>
  `
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
}
