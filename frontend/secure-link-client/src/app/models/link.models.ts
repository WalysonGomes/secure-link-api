export interface CreateLinkRequest {
  targetUrl: string;
  expiresAt?: string;
  maxViews?: number;
  password?: string;
}

export interface CreateLinkResponse {
  shortCode: string;
  accessUrl: string;
  expiresAt?: string;
  maxViews?: number;
}

export interface OpenLinkResult {
  status: number;
  blob?: Blob;
}
