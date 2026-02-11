export interface CreateLinkRequest {
  targetUrl: string;
  expiresAt?: string;
  maxViews?: number;
  password?: string;
}

export interface LinkResponse {
  shortCode: string;
  accessUrl: string;
  expiresAt?: string;
  maxViews?: number;
}

export interface LinksStats {
  active: number;
  expired: number;
  revoked: number;
}

export interface AccessSummary {
  total: number;
  success: number;
  failed: number;
  expired: number;
  uniqueOrigins: number;
}

export interface HourlyAccess {
  hour: number;
  count: number;
}

export interface DailyAccess {
  accessDate: string;
  count: number;
}

export interface AccessFailure {
  result: string;
  count: number;
}

export interface TopLink {
  shortCode: string;
  accessCount: number;
}

export interface SecurityException {
  shortCode: string;
  count: number;
}

export interface ApiError {
  status: number;
  message: string;
  errorId?: string;
}
