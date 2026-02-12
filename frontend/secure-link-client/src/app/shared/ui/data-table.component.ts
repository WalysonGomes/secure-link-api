import { Component, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="w-full p-4 sm:p-5">
      <div class="overflow-x-auto rounded-xl border border-zinc-200 bg-white/45 dark:border-white/10 dark:bg-zinc-900/35">
        <table class="table table-zebra w-full min-w-full">
          <thead>
            <tr>
              @for (column of columns(); track column) {
                <th class="px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  {{ column }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (rows().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length" class="px-5 py-10">
                  <div class="mx-auto flex max-w-md flex-col items-center justify-center gap-2 text-center text-zinc-500 dark:text-zinc-400">
                    <i [class]="emptyIcon() + ' text-4xl opacity-90'"></i>
                    <p class="text-sm font-medium">{{ emptyTitle() }}</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of rows(); track $index) {
                <tr class="hover">
                  @for (cell of row; track $index) {
                    <td class="px-5 py-3 text-sm">{{ cell }}</td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DataTableComponent {
  readonly columns = input.required<string[]>();
  readonly rows = input.required<Array<Array<string | number>>>();
  readonly emptyTitle = input('Sem dados para exibir.');
  readonly emptyIcon = input('ri-donut-chart-line');
}
