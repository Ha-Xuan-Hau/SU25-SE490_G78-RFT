export interface ReportGroupedByTargetDTO {
  targetId: string;
  reportedNameOrVehicle: string;
  email: string;
  type: string;
  count: number;
}

export interface ReportSummaryDTO {
  reportId: string;
  type: string;
  reportStatus: string;
  appealDeadline?: string;
  canAppeal?: boolean;
  hasAppealed?: boolean;
  currentFlagCount?: number;
}

export interface ReportedUserDTO {
  id: string;
  fullName: string;
  email: string;
}

export interface ReporterDetailDTO {
  id: string;
  fullName: string;
  email: string;
  reason: string;
  evidenceUrl?: string; // Optional, can be null if not provided
  createdAt: string;
  booking: string;
  reportStatus: string;
}

export interface ReportDetailDTO {
  reportSummary: ReportSummaryDTO;
  reportedUser: ReportedUserDTO;
  reporters: ReporterDetailDTO[];
  appealInfo?: AppealInfoDTO;
}

export interface AggregatedReport {
  id: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportCount: number;
  types: Set<string>;
}

export interface AppealInfoDTO {
  appealId: string;
  appellantName: string;
  appellantEmail: string;
  reason: string;
  evidenceUrl?: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
