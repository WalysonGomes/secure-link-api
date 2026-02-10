import { Component, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="overflow-x-auto rounded-xl border border-zinc-200 bg-white/40 dark:border-white/10 dark:bg-transparent">
      <table class="table table-zebra table-sm">
        <thead>
          <tr>
            @for (column of columns(); track column) {
              <th class="text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{{ column }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="py-10 text-center">
                <div class="mx-auto flex max-w-sm flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <i [class]="emptyIcon() + ' text-3xl'"></i>
                  <p class="text-sm font-medium">{{ emptyTitle() }}</p>
                </div>
              </td>
            </tr>
          } @else {
            @for (row of rows(); track $index) {
              <tr class="hover">
                @for (cell of row; track $index) {
                  <td>{{ cell }}</td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class DataTableComponent {
  readonly columns = input.required<string[]>();
  readonly rows = input.required<Array<Array<string | number>>>();
  readonly emptyTitle = input('Sem dados para exibir.');
  readonly emptyIcon = input('ri-donut-chart-line');
}
