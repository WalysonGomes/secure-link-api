import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { CreateLinkRequest, LinkResponse, OpenLinkResult } from '../../models/link.models';
import {
  AccessSummary,
  DailyStat,
  FailureStat,
  HourlyStat,
  LinkStats,
  SecurityExceptionStat,
  TopLinkStat,
} from '../../models/stats.models';

@Injectable({ providedIn: 'root' })
export class SecureLinkApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly baseUrl: string,
  ) {}

  createLink(payload: CreateLinkRequest): Observable<LinkResponse> {
    return this.http.post<LinkResponse>(`${this.baseUrl}/api/links`, payload);
  }

  uploadFile(file: File, options: Omit<CreateLinkRequest, 'targetUrl'>): Observable<LinkResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options.expiresAt) formData.append('expiresAt', options.expiresAt);
    if (options.maxViews) formData.append('maxViews', String(options.maxViews));
    if (options.password) formData.append('password', options.password);

    return this.http.post<LinkResponse>(`${this.baseUrl}/api/links/upload`, formData);
  }

  openLink(shortCode: string, password?: string): Observable<OpenLinkResult> {
    const headers = password ? new HttpHeaders({ 'X-Link-Password': password }) : undefined;
    return this.http
      .get(`${this.baseUrl}/l/${shortCode}`, {
        observe: 'response',
        responseType: 'blob',
        headers,
      })
      .pipe(map((response) => this.handleOpenResponse(response, shortCode, password)));
  }

  revokeLink(shortCode: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/l/${shortCode}`);
  }

  getLinkStats(): Observable<LinkStats> {
    return this.http.get<LinkStats>(`${this.baseUrl}/api/stats/links`);
  }

  getAccessSummary(): Observable<AccessSummary> {
    return this.http.get<AccessSummary>(`${this.baseUrl}/api/stats/access/summary`);
  }

  getAccessHourly(): Observable<HourlyStat[]> {
    return this.http.get<HourlyStat[]>(`${this.baseUrl}/api/stats/access/hourly`);
  }

  getAccessDaily(): Observable<DailyStat[]> {
    return this.http.get<DailyStat[]>(`${this.baseUrl}/api/stats/access/daily`);
  }

  getAccessFailures(): Observable<FailureStat[]> {
    return this.http.get<FailureStat[]>(`${this.baseUrl}/api/stats/access/failures`);
  }

  getTopLinks(limit = 5): Observable<TopLinkStat[]> {
    return this.http.get<TopLinkStat[]>(`${this.baseUrl}/api/stats/links/top?limit=${limit}`);
  }

  getSecurityExceptions(limit = 5): Observable<SecurityExceptionStat[]> {
    return this.http.get<SecurityExceptionStat[]>(`${this.baseUrl}/api/stats/security/exceptions?limit=${limit}`);
  }

  private handleOpenResponse(response: HttpResponse<Blob>, shortCode: string, password?: string): OpenLinkResult {
    const contentDisposition = response.headers.get('content-disposition')?.toLowerCase() ?? '';
    const isFile = contentDisposition.includes('attachment') || contentDisposition.includes('filename=');

    if (isFile && response.body) {
      return { type: 'file', blob: response.body };
    }

    const linkUrl = `${this.baseUrl}/l/${shortCode}`;
    const target = password ? '_self' : '_blank';
    window.open(linkUrl, target, 'noopener,noreferrer');
    return { type: 'redirect' };
  }
}
