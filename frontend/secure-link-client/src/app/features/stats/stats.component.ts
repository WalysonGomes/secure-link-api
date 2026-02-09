import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { forkJoin, interval, Subscription } from 'rxjs';
import { SecureLinkApiService } from '../../core/api/secure-link-api.service';
import { AccessSummary, DailyStat, FailureStat, HourlyStat, LinkStats, SecurityExceptionStat, TopLinkStat } from '../../models/stats.models';

@Component({
  selector: 'app-stats',
  imports: [CommonModule],
  templateUrl: './stats.component.html',
})
export class StatsComponent implements OnInit, OnDestroy {
  private readonly api = inject(SecureLinkApiService);
  private pollingSub?: Subscription;

  protected readonly links = signal<LinkStats | null>(null);
  protected readonly summary = signal<AccessSummary | null>(null);
  protected readonly hourly = signal<HourlyStat[]>([]);
  protected readonly daily = signal<DailyStat[]>([]);
  protected readonly failures = signal<FailureStat[]>([]);
  protected readonly topLinks = signal<TopLinkStat[]>([]);
  protected readonly security = signal<SecurityExceptionStat[]>([]);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.refresh();
    this.pollingSub = interval(20_000).subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  protected refresh(): void {
    this.loading.set(true);
    forkJoin({
      links: this.api.getLinkStats(),
      summary: this.api.getAccessSummary(),
      hourly: this.api.getAccessHourly(),
      daily: this.api.getAccessDaily(),
      failures: this.api.getAccessFailures(),
      topLinks: this.api.getTopLinks(5),
      security: this.api.getSecurityExceptions(5),
    }).subscribe({
      next: (data) => {
        this.links.set(data.links);
        this.summary.set(data.summary);
        this.hourly.set(data.hourly);
        this.daily.set(data.daily);
        this.failures.set(data.failures);
        this.topLinks.set(data.topLinks);
        this.security.set(data.security);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
