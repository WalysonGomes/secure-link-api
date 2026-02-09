export interface CreateLinkRequest {
  targetUrl: string;
  expiresAt?: string;
  maxViews?: number;
  password?: string;
}

export interface LinkResponse {
  shortCode: string;
  accessUrl: string;
  expiresAt?: string | null;
  maxViews?: number | null;
}

export interface OpenLinkResult {
  type: 'file' | 'redirect';
  blob?: Blob;
}
