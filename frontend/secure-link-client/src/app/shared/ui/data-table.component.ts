import { Component, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="overflow-x-auto rounded-xl border border-base-300 bg-base-100/60">
      <table class="table table-zebra table-sm">
        <thead>
          <tr>
            @for (column of columns(); track column) {
              <th class="text-xs uppercase tracking-[0.16em] text-base-content/60">{{ column }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="py-10 text-center text-base-content/60">
                <div class="mx-auto flex max-w-sm flex-col items-center gap-2">
                  <i [class]="emptyIcon() + ' text-3xl text-base-content/45'"></i>
                  <p class="font-medium">{{ emptyTitle() }}</p>
                  <p class="text-xs">{{ emptyMessage() }}</p>
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
  readonly emptyTitle = input('Sem dados por enquanto');
  readonly emptyMessage = input('Crie seu primeiro link para começar a gerar tráfego.');
  readonly emptyIcon = input('ri-donut-chart-line');
}
