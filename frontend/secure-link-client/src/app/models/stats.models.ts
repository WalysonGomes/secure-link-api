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

export interface FailureStats {
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
