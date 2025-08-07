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
  createdAt: string;
}

export interface ReportSummaryDTO {
  reportId: string;
  type: string;
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
