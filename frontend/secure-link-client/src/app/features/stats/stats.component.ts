import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EMPTY, Subject, forkJoin, timer } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { StatsApiService } from '../../core/api/stats-api.service';
import { ApiError } from '../../models/api-error.models';
import {
  AccessSummary,
  DailyAccess,
  FailureStats,
  HourlyAccess,
  LinksStats,
  SecurityException,
  TopLink
} from '../../models/stats.models';
import { OpenSecureLinkComponent } from '../../shared/ui/open-secure-link.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [DatePipe, OpenSecureLinkComponent],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit, OnDestroy {
  linksStats?: LinksStats;
  accessSummary?: AccessSummary;
  hourly: HourlyAccess[] = [];
  daily: DailyAccess[] = [];
  failures: FailureStats[] = [];
  topLinks: TopLink[] = [];
  securityExceptions: SecurityException[] = [];

  lastUpdated?: Date;
  loading = false;
  error = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly statsApi: StatsApiService) {}

  ngOnInit(): void {
    timer(0, 20000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      links: this.statsApi.getLinksStats(),
      summary: this.statsApi.getAccessSummary(),
      hourly: this.statsApi.getAccessHourly(),
      daily: this.statsApi.getAccessDaily(),
      failures: this.statsApi.getAccessFailures(),
      top: this.statsApi.getTopLinks(5),
      security: this.statsApi.getSecurityExceptions(5)
    })
      .pipe(
        catchError((error: ApiError) => {
          this.error = error.errorId ? `${error.message} (errorId: ${error.errorId})` : error.message;
          this.loading = false;
          return EMPTY;
        })
      )
      .subscribe((data) => {
        this.linksStats = data.links;
        this.accessSummary = data.summary;
        this.hourly = data.hourly;
        this.daily = data.daily;
        this.failures = data.failures;
        this.topLinks = data.top;
        this.securityExceptions = data.security;
        this.lastUpdated = new Date();
        this.loading = false;
      });
  }
}
