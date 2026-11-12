import { DashboardResponseDetails } from '../../reports/dashboard-drill-down/domain/dashboard-drill-down.model';
import {
  ResponseFlagDetails,
  SurveyResponseFlagType,
} from '../../../shared/models/response-flag.model';

export interface FeedbackPage<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly T[];
}
export interface FlagCapabilityRole {
  roleId: string;
  name: string;
  permission: string;
}
export interface FlagOfficerDetails {
  flagOfficerId: string;
  applicationUserId: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string | null;
  userName: string;
  email: string;
  nameEn: string;
  nameAr: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdByApplicationUserId: string;
  createdOnUtc: string;
  roles: readonly FlagCapabilityRole[];
}
export interface FlagOfficerProfile {
  nameEn: string;
  nameAr: string | null;
  email: string;
  phoneNumber: string | null;
}
export interface CreateFlagOfficer extends FlagOfficerProfile {
  departmentId?: string;
  userName: string;
  password: string;
}
export interface FlagOfficerChange {
  flagOfficerId: string;
  applicationUserId: string;
  departmentId: string;
  isActive: boolean;
}
export interface FlaggedResponseSummary {
  responseId: string;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  flagsCount: number;
}
export interface FlaggedResponseDetails {
  response: DashboardResponseDetails;
  flags: readonly ResponseFlagDetails[];
}
export interface FlaggedResponsesQuery {
  pageNumber: number;
  pageSize: number;
  orderSort?: string;
  searchText?: string;
  type?: SurveyResponseFlagType;
  answered?: boolean;
  from?: string;
  to?: string;
}
