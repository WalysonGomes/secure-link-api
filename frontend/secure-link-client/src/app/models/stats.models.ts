export interface LinkStats {
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

export interface HourlyStat {
  hour: number;
  count: number;
}

export interface DailyStat {
  accessDate: string;
  count: number;
}

export interface FailureStat {
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
