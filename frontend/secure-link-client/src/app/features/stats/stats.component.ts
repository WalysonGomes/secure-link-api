import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { catchError, finalize, interval, of, Subscription } from 'rxjs';
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

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
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
  private refreshSequence = 0;

  constructor(private readonly linksApi: LinksApiService) {}

  ngOnInit(): void {
    this.refresh();
    this.pollingSub = interval(20_000).subscribe(() => this.refresh(false));
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  refresh(showLoader = true): void {
    const refreshId = ++this.refreshSequence;

    if (showLoader) {
      this.isLoading.set(true);
    }

    this.error.set('');

    let pendingRequests = 7;
    let hasPartialFailure = false;

    const finishRequest = () => {
      pendingRequests -= 1;

      if (pendingRequests === 0 && this.refreshSequence === refreshId) {
        this.updatedAt.set(new Date());
        this.isLoading.set(false);

        if (hasPartialFailure) {
          this.error.set('Parte dos dados não pôde ser carregada agora. Atualize novamente em instantes.');
        }
      }
    };

    const markFailed = () => {
      hasPartialFailure = true;
    };

    this.linksApi
      .getLinksStats()
      .pipe(
        catchError(() => {
          markFailed();
          return of<LinksStats | null>(null);
        }),
        finalize(finishRequest)
      )
      .subscribe((links) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.linksStats.set(links);
      });

    this.linksApi
      .getAccessSummary()
      .pipe(
        catchError(() => {
          markFailed();
          return of<AccessSummary | null>(null);
        }),
        finalize(finishRequest)
      )
      .subscribe((summary) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.summaryStats.set(summary);
      });

    this.linksApi
      .getAccessHourly()
      .pipe(
        catchError(() => {
          markFailed();
          return of<HourlyAccess[]>([]);
        }),
        finalize(finishRequest)
      )
      .subscribe((hourly) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.hourly.set(hourly.filter((item) => typeof item?.hour === 'number' && typeof item?.count === 'number'));
      });

    this.linksApi
      .getAccessDaily()
      .pipe(
        catchError(() => {
          markFailed();
          return of<DailyAccess[]>([]);
        }),
        finalize(finishRequest)
      )
      .subscribe((daily) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.daily.set(
          daily
            .map((item: DailyAccess & { date?: string }) => ({
              ...item,
              accessDate: item.accessDate ?? item.date ?? ''
            }))
            .filter((item) => item.accessDate && typeof item.count === 'number')
        );
      });

    this.linksApi
      .getAccessFailures()
      .pipe(
        catchError(() => {
          markFailed();
          return of<AccessFailure[]>([]);
        }),
        finalize(finishRequest)
      )
      .subscribe((failures) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.failures.set(failures.filter((item) => !!item?.result && typeof item?.count === 'number'));
      });

    this.linksApi
      .getTopLinks(5)
      .pipe(
        catchError(() => {
          markFailed();
          return of<TopLink[]>([]);
        }),
        finalize(finishRequest)
      )
      .subscribe((topLinks) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.topLinks.set(topLinks.filter((item) => !!item?.shortCode && typeof item?.accessCount === 'number'));
      });

    this.linksApi
      .getSecurityExceptions(5)
      .pipe(
        catchError(() => {
          markFailed();
          return of<SecurityException[]>([]);
        }),
        finalize(finishRequest)
      )
      .subscribe((securityExceptions) => {
        if (this.refreshSequence !== refreshId) {
          return;
        }

        this.securityExceptions.set(
          securityExceptions.filter((item) => !!item?.shortCode && typeof item?.count === 'number')
        );
      });
  }

  orderedHourly(): HourlyAccess[] {
    return this.hourly()
      .slice()
      .sort((a, b) => a.hour - b.hour);
  }

  private dailyLabel(item: DailyAccess & { date?: string }): string {
    return item.accessDate ?? item.date ?? '';
  }

  orderedDaily(): DailyAccess[] {
    return this.daily()
      .slice()
      .filter((item) => !!this.dailyLabel(item as DailyAccess & { date?: string }))
      .sort((a: DailyAccess & { date?: string }, b: DailyAccess & { date?: string }) =>
        this.dailyLabel(a).localeCompare(this.dailyLabel(b))
      );
  }

  dailyItemLabel(item: DailyAccess & { date?: string }): string {
    return this.dailyLabel(item);
  }


  localHour(hour: number): number {
    const offsetHours = -new Date().getTimezoneOffset() / 60;
    return (hour + offsetHours + 24) % 24;
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

}
