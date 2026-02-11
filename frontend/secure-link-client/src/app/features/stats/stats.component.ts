import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { forkJoin, interval, Subscription } from 'rxjs';
import { LinksApiService } from '../../core/api/links-api.service';
import {
  AccessFailure,
  AccessSummary,
  DailyAccess,
  HourlyAccess,
  LinksStats,
  SecurityException,
  TopLink
} from '../../shared/models/api.models';
import { DataTableComponent } from '../../shared/ui/data-table.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit, OnDestroy {
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly updatedAt = signal<Date | null>(null);

  readonly linksStats = signal<LinksStats | null>(null);
  readonly summaryStats = signal<AccessSummary | null>(null);
  readonly hourly = signal<HourlyAccess[]>([]);
  readonly daily = signal<DailyAccess[]>([]);
  readonly failures = signal<AccessFailure[]>([]);
  readonly topLinks = signal<TopLink[]>([]);
  readonly securityExceptions = signal<SecurityException[]>([]);

  readonly skeletonItems = Array.from({ length: 8 });

  private pollingSub?: Subscription;

  constructor(private readonly linksApi: LinksApiService) {}

  ngOnInit(): void {
    this.refresh();
    this.pollingSub = interval(20_000).subscribe(() => this.refresh(false));
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  refresh(showLoader = true): void {
    if (showLoader) {
      this.isLoading.set(true);
    }

    this.error.set('');

    forkJoin({
      links: this.linksApi.getLinksStats(),
      summary: this.linksApi.getAccessSummary(),
      hourly: this.linksApi.getAccessHourly(),
      daily: this.linksApi.getAccessDaily(),
      failures: this.linksApi.getAccessFailures(),
      top: this.linksApi.getTopLinks(5),
      security: this.linksApi.getSecurityExceptions(5)
    }).subscribe({
      next: (response) => {
        this.linksStats.set(response.links);
        this.summaryStats.set(response.summary);
        this.hourly.set(response.hourly);
        this.daily.set(response.daily);
        this.failures.set(response.failures);
        this.topLinks.set(response.top);
        this.securityExceptions.set(response.security);
        this.updatedAt.set(new Date());
        this.isLoading.set(false);
      },
      error: (error: { message?: string }) => {
        this.error.set(error.message ?? 'Falha ao carregar os dados do dashboard.');
        this.isLoading.set(false);
      }
    });
  }

  orderedHourly(): HourlyAccess[] {
    return this.hourly()
      .slice()
      .sort((a, b) => a.hour - b.hour);
  }

  orderedDaily(): DailyAccess[] {
    return this.daily()
      .slice()
      .sort((a, b) => a.accessDate.localeCompare(b.accessDate));
  }

  peakHourlyCount(): number {
    return Math.max(...this.orderedHourly().map((item) => item.count), 1);
  }

  peakDailyCount(): number {
    return Math.max(...this.orderedDaily().map((item) => item.count), 1);
  }

  percentageFromPeak(value: number, peak: number): number {
    return Math.round((value / Math.max(peak, 1)) * 100);
  }

  isHourlyPeak(item: HourlyAccess): boolean {
    return item.count === this.peakHourlyCount();
  }

  isDailyPeak(item: DailyAccess): boolean {
    return item.count === this.peakDailyCount();
  }

  copyShortCode(shortCode: string): void {
    navigator.clipboard.writeText(shortCode);
  }

  translatedFailureLabel(code: string): string {
    const map: Record<string, string> = {
      PASSWORD_REQUIRED: 'Senha obrigatória',
      INVALID_PASSWORD: 'Senha inválida',
      LINK_EXPIRED: 'Link expirado',
      LINK_REVOKED: 'Link revogado',
      LINK_NOT_FOUND: 'Link não encontrado',
      MAX_VIEWS_REACHED: 'Limite de visualizações atingido'
    };

    return map[code] ?? code;
  }

  failureTone(code: string): string {
    if (code === 'PASSWORD_REQUIRED' || code === 'INVALID_PASSWORD') {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }

    if (code.includes('EXPIRED') || code.includes('REVOKED')) {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }

    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }

  toSecurityRows(): Array<Array<string | number>> {
    return this.securityExceptions().map((item) => [item.shortCode, item.count]);
  }
}
