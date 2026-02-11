import { HttpClient, HttpContext, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccessFailure,
  AccessSummary,
  CreateLinkRequest,
  DailyAccess,
  HourlyAccess,
  LinkResponse,
  LinksStats,
  SecurityException,
  TopLink
} from '../../shared/models/api.models';
import { API_BASE_URL } from '../config/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '../interceptors/request-flags';

@Injectable({
  providedIn: 'root'
})
export class LinksApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly baseUrl: string
  ) {}

  createLink(payload: CreateLinkRequest): Observable<LinkResponse> {
    return this.http.post<LinkResponse>(`${this.baseUrl}api/links`, payload);
  }

  uploadLink(file: File, options: Omit<CreateLinkRequest, 'targetUrl'>): Observable<LinkResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (options.expiresAt) {
      formData.append('expiresAt', options.expiresAt);
    }

    if (typeof options.maxViews === 'number') {
      formData.append('maxViews', String(options.maxViews));
    }

    if (options.password) {
      formData.append('password', options.password);
    }

    return this.http.post<LinkResponse>(`${this.baseUrl}api/links/upload`, formData);
  }

  openSecureLink(shortCode: string, password?: string): Observable<HttpResponse<Blob>> {
    let headers = new HttpHeaders();

    if (password) {
      headers = headers.set('X-Link-Password', password);
    }

    return this.http.get(`${this.baseUrl}l/${shortCode}`, {
      headers,
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      observe: 'response',
      responseType: 'blob'
    });
  }

  revokeLink(shortCode: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}l/${shortCode}`);
  }

  getLinksStats(): Observable<LinksStats> {
    return this.http.get<LinksStats>(`${this.baseUrl}api/stats/links`);
  }

  getAccessSummary(): Observable<AccessSummary> {
    return this.http.get<AccessSummary>(`${this.baseUrl}api/stats/access/summary`);
  }

  getAccessHourly(): Observable<HourlyAccess[]> {
    return this.http.get<HourlyAccess[]>(`${this.baseUrl}api/stats/access/hourly`);
  }

  getAccessDaily(): Observable<DailyAccess[]> {
    return this.http.get<DailyAccess[]>(`${this.baseUrl}api/stats/access/daily`);
  }

  getAccessFailures(): Observable<AccessFailure[]> {
    return this.http.get<AccessFailure[]>(`${this.baseUrl}api/stats/access/failures`);
  }

  getTopLinks(limit = 5): Observable<TopLink[]> {
    return this.http.get<TopLink[]>(`${this.baseUrl}api/stats/links/top?limit=${limit}`);
  }

  getSecurityExceptions(limit = 5): Observable<SecurityException[]> {
    return this.http.get<SecurityException[]>(
      `${this.baseUrl}api/stats/security/exceptions?limit=${limit}`
    );
  }
}
