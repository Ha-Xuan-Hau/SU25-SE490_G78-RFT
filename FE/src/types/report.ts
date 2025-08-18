export interface ReportGroupedByTargetDTO {
  targetId: string;
  reportId?: string;
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
  hasProcessed: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ReportedUserDTO {
  id: string;
  fullName: string;
  email: string;

  vehicleId?: string;
  vehicleName?: string;
  vehicleImage?: string;
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
  reportId?: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportCount: number;
  types: Set<string>;
}

export interface AggregatedNonSeriousReport {
  targetId: string;
  reportedNameOrVehicle: string;
  email: string;
  types: Set<string>;
  totalCount: number;
  reports: ReportGroupedByTargetDTO[];
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
