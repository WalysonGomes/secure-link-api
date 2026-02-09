import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, interval, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { SecureLinkApiService } from '../../core/api/secure-link-api.service';
import {
  AccessSummaryStats,
  AppError,
  DailyAccessStat,
  FailureAccessStat,
  HourlyAccessStat,
  LinksStats,
  SecurityExceptionStat,
  TopLinkStat
} from '../../shared/models/api.models';

@Component({
  selector: 'app-stats',
  imports: [CommonModule],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit, OnDestroy {
  linksStats: LinksStats | null = null;
  summaryStats: AccessSummaryStats | null = null;
  hourly: HourlyAccessStat[] = [];
  daily: DailyAccessStat[] = [];
  failures: FailureAccessStat[] = [];
  topLinks: TopLinkStat[] = [];
  securityExceptions: SecurityExceptionStat[] = [];

  loading = false;
  errorMessage = '';
  lastUpdated: Date | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly api: SecureLinkApiService) {}

  ngOnInit(): void {
    this.refresh();

    interval(20_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      linksStats: this.api.getLinksStats(),
      summaryStats: this.api.getAccessSummaryStats(),
      hourly: this.api.getHourlyAccessStats(),
      daily: this.api.getDailyAccessStats(),
      failures: this.api.getFailureAccessStats(),
      topLinks: this.api.getTopLinksStats(5),
      securityExceptions: this.api.getSecurityExceptionsStats(5).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.linksStats = data.linksStats;
        this.summaryStats = data.summaryStats;
        this.hourly = data.hourly;
        this.daily = data.daily;
        this.failures = data.failures;
        this.topLinks = data.topLinks;
        this.securityExceptions = data.securityExceptions;
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: (error: AppError) => {
        this.errorMessage = error.errorId
          ? `${error.message} (errorId: ${error.errorId})`
          : error.message;
        this.loading = false;
      }
    });
  }
}
