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
        this.error.set(error.message ?? 'Failed to load dashboard data.');
        this.isLoading.set(false);
      }
    });
  }

  maxHourly(): number {
    return Math.max(...this.hourly().map((item) => item.count), 1);
  }

  maxDaily(): number {
    return Math.max(...this.daily().map((item) => item.count), 1);
  }

  toHourlyRows(): Array<Array<string | number>> {
    return this.hourly()
      .slice()
      .sort((a, b) => a.hour - b.hour)
      .map((item) => [item.hour, item.count]);
  }

  toDailyRows(): Array<Array<string | number>> {
    return this.daily().map((item) => [item.accessDate, item.count]);
  }

  toFailureRows(): Array<Array<string | number>> {
    return this.failures().map((item) => [item.result, item.count]);
  }

  toTopRows(): Array<Array<string | number>> {
    return this.topLinks().map((item) => [item.shortCode, item.accessCount]);
  }

  toSecurityRows(): Array<Array<string | number>> {
    return this.securityExceptions().map((item) => [item.shortCode, item.count]);
  }
}
