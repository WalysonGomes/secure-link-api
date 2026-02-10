import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, signal } from '@angular/core';
import { catchError, of, Subscription, timer } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiStatusService implements OnDestroy {
  readonly online = signal<boolean | null>(null);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly sub: Subscription;

  constructor() {
    this.sub = timer(0, 20000).subscribe(() => this.check());
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private check(): void {
    this.http
      .get(`${this.baseUrl}api/stats/links`)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => this.online.set(Boolean(result)));
  }
}
