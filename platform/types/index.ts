// Common types for the VigilAI Platform

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

export enum PrStatus {
  OPEN = 'OPEN',
  MERGED = 'MERGED',
  CLOSED = 'CLOSED',
}

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface IncidentFilters {
  severity?: Severity[];
  status?: IncidentStatus[];
  applicationId?: string;
  dateRange?: TimeRange;
  search?: string;
}

export interface MetricsOverview {
  totalIncidents: number;
  avgResponseTime: number;
  errorRate: number;
  activeApplications: number;
  incidentsBySeverity: Record<Severity, number>;
  recentTrends: {
    incidents: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}
