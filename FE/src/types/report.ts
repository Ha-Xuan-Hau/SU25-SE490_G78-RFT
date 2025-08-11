export interface ReportGroupedByTargetDTO {
  targetId: string;
  reportedNameOrVehicle: string;
  email: string;
  type: string;
  count: number;
}

export interface ReporterDetailDTO {
  id: string;
  fullName: string;
  email: string;
  reason: string;
  evidenceUrl?: string; // Optional, can be null if not provided
  createdAt: string;
}

export interface ReportSummaryDTO {
  reportId: string;
  type: string;
  booking: string;
}

export interface ReportedUserDTO {
  id: string;
  fullName: string;
  email: string;
}

export interface ReportDetailDTO {
  reportSummary: ReportSummaryDTO;
  reportedUser: ReportedUserDTO;
  reporters: ReporterDetailDTO[];
}

export interface AggregatedReport {
  id: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportCount: number;
  types: Set<string>;
}
