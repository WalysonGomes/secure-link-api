export interface LinkResponse {
  shortCode: string;
  accessUrl: string;
  expiresAt?: string | null;
  maxViews?: number | null;
}

export interface LinksStats {
  active: number;
  expired: number;
  revoked: number;
}

export interface AccessSummaryStats {
  total: number;
  success: number;
  failed: number;
  expired: number;
  uniqueOrigins: number;
}

export interface HourlyAccessStat {
  hour: number;
  count: number;
}

export interface DailyAccessStat {
  accessDate: string;
  count: number;
}

export interface FailureAccessStat {
  result: string;
  count: number;
}

export interface TopLinkStat {
  shortCode: string;
  accessCount: number;
}

export interface SecurityExceptionStat {
  shortCode: string;
  count: number;
}

export interface AppError {
  status: number;
  message: string;
  errorId?: string;
}
