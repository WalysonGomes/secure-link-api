import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import {
  AccessSummaryStats,
  DailyAccessStat,
  FailureAccessStat,
  HourlyAccessStat,
  LinkResponse,
  LinksStats,
  SecurityExceptionStat,
  TopLinkStat
} from '../../shared/models/api.models';

export interface CreateLinkPayload {
  targetUrl: string;
  expiresAt?: string;
  maxViews?: number;
  password?: string;
}

export interface UploadLinkPayload {
  file: File;
  expiresAt?: string;
  maxViews?: number;
  password?: string;
}

export interface OpenLinkResult {
  kind: 'url' | 'file';
  finalUrl?: string | null;
  blob?: Blob;
  filename?: string;
}

@Injectable({ providedIn: 'root' })
export class SecureLinkApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBase: string
  ) {}

  createLink(payload: CreateLinkPayload): Observable<LinkResponse> {
    return this.http.post<LinkResponse>(`${this.apiBase}/api/links`, payload);
  }

  uploadLink(payload: UploadLinkPayload): Observable<LinkResponse> {
    const formData = new FormData();
    formData.append('file', payload.file);

    if (payload.expiresAt) formData.append('expiresAt', payload.expiresAt);
    if (payload.maxViews) formData.append('maxViews', payload.maxViews.toString());
    if (payload.password) formData.append('password', payload.password);

    return this.http.post<LinkResponse>(`${this.apiBase}/api/links/upload`, formData);
  }

  revokeLink(shortCode: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/l/${shortCode}`);
  }

  openLink(shortCode: string, password?: string): Observable<OpenLinkResult> {
    const headers = password ? new HttpHeaders({ 'X-Link-Password': password }) : undefined;

    return this.http
      .get(`${this.apiBase}/l/${shortCode}`, {
        headers,
        observe: 'response',
        responseType: 'blob'
      })
      .pipe(map((response) => this.toOpenLinkResult(response)));
  }

  getLinksStats(): Observable<LinksStats> {
    return this.http.get<LinksStats>(`${this.apiBase}/api/stats/links`);
  }

  getAccessSummaryStats(): Observable<AccessSummaryStats> {
    return this.http.get<AccessSummaryStats>(`${this.apiBase}/api/stats/access/summary`);
  }

  getHourlyAccessStats(): Observable<HourlyAccessStat[]> {
    return this.http.get<HourlyAccessStat[]>(`${this.apiBase}/api/stats/access/hourly`);
  }

  getDailyAccessStats(): Observable<DailyAccessStat[]> {
    return this.http.get<DailyAccessStat[]>(`${this.apiBase}/api/stats/access/daily`);
  }

  getFailureAccessStats(): Observable<FailureAccessStat[]> {
    return this.http.get<FailureAccessStat[]>(`${this.apiBase}/api/stats/access/failures`);
  }

  getTopLinksStats(limit = 5): Observable<TopLinkStat[]> {
    return this.http.get<TopLinkStat[]>(`${this.apiBase}/api/stats/links/top?limit=${limit}`);
  }

  getSecurityExceptionsStats(limit = 5): Observable<SecurityExceptionStat[]> {
    return this.http.get<SecurityExceptionStat[]>(
      `${this.apiBase}/api/stats/security/exceptions?limit=${limit}`
    );
  }

  private toOpenLinkResult(response: HttpResponse<Blob>): OpenLinkResult {
    const disposition = response.headers.get('content-disposition')?.toLowerCase() ?? '';
    const isFile = disposition.includes('attachment') || disposition.includes('filename=');

    if (isFile) {
      return {
        kind: 'file',
        blob: response.body ?? undefined,
        filename: this.extractFilename(response.headers.get('content-disposition'))
      };
    }

    return {
      kind: 'url',
      finalUrl: response.url
    };
  }

  private extractFilename(disposition: string | null): string {
    if (!disposition) return 'secure-link-download';
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);

    return decodeURIComponent(match?.[1] ?? 'secure-link-download');
  }
}
