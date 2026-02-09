import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CreateLinkRequest, CreateLinkResponse, OpenLinkResult } from '../../models/link.models';

@Injectable({ providedIn: 'root' })
export class LinksApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {}

  createLink(payload: CreateLinkRequest): Observable<CreateLinkResponse> {
    return this.http.post<CreateLinkResponse>(`${this.apiBaseUrl}/api/links`, payload);
  }

  uploadLink(formData: FormData): Observable<CreateLinkResponse> {
    return this.http.post<CreateLinkResponse>(`${this.apiBaseUrl}/api/links/upload`, formData);
  }

  revokeLink(shortCode: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/l/${shortCode}`);
  }

  getPublicAccessUrl(shortCode: string): string {
    return `${this.apiBaseUrl}/l/${shortCode}`;
  }

  openSecureLink(shortCode: string, password?: string): Observable<HttpResponse<Blob>> {
    const headers = password ? new HttpHeaders({ 'X-Link-Password': password }) : undefined;
    return this.http.get(`${this.apiBaseUrl}/l/${shortCode}`, {
      observe: 'response',
      responseType: 'blob',
      headers
    });
  }

  mapOpenResult(response: HttpResponse<Blob>): OpenLinkResult {
    return {
      status: response.status,
      blob: response.body ?? undefined
    };
  }
}
