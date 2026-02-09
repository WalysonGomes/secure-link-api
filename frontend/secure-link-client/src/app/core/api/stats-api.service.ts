import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AccessSummary,
  DailyAccess,
  FailureStats,
  HourlyAccess,
  LinksStats,
  SecurityException,
  TopLink
} from '../../models/stats.models';

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {}

  getLinksStats(): Observable<LinksStats> {
    return this.http.get<LinksStats>(`${this.apiBaseUrl}/api/stats/links`);
  }

  getAccessSummary(): Observable<AccessSummary> {
    return this.http.get<AccessSummary>(`${this.apiBaseUrl}/api/stats/access/summary`);
  }

  getAccessHourly(): Observable<HourlyAccess[]> {
    return this.http.get<HourlyAccess[]>(`${this.apiBaseUrl}/api/stats/access/hourly`);
  }

  getAccessDaily(): Observable<DailyAccess[]> {
    return this.http.get<DailyAccess[]>(`${this.apiBaseUrl}/api/stats/access/daily`);
  }

  getAccessFailures(): Observable<FailureStats[]> {
    return this.http.get<FailureStats[]>(`${this.apiBaseUrl}/api/stats/access/failures`);
  }

  getTopLinks(limit: number): Observable<TopLink[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<TopLink[]>(`${this.apiBaseUrl}/api/stats/links/top`, { params });
  }

  getSecurityExceptions(limit: number): Observable<SecurityException[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<SecurityException[]>(`${this.apiBaseUrl}/api/stats/security/exceptions`, { params });
  }
}
