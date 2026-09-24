export type SatisfactionCategory = 'Satisfied' | 'Neutral' | 'Unhappy';

export interface DashboardDetailsNavigation {
  routeType: string;
  method: 'GET';
  path: string;
}

export interface DashboardSatisfactionItem {
  category: SatisfactionCategory;
  responsesCount: number;
  percentage: number;
  detailsNavigation: DashboardDetailsNavigation | null;
}

export interface DashboardCharts {
  satisfactionDistribution: readonly DashboardSatisfactionItem[];
}

export interface DashboardSummaryActions {
  allResponses: DashboardDetailsNavigation | null;
  complaints: DashboardDetailsNavigation | null;
  voiceAnswers: DashboardDetailsNavigation | null;
}

export interface DashboardDrillDownContext {
  title: string;
  navigation: DashboardDetailsNavigation;
}

export type DashboardResponseSource = 'Internal' | 'Anonymous' | null;

export interface DashboardResponseCustomInputPreview {
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  value: string;
}

export interface DashboardResponseListItem {
  responseId: string;
  source: DashboardResponseSource;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  operatorId: string | null;
  operatorNameEn: string | null;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number | null;
  isScored: boolean;
  hasComplaint: boolean;
  hasVoice: boolean;
  customInputsPreview: readonly DashboardResponseCustomInputPreview[];
  detailsNavigation: DashboardDetailsNavigation | null;
}

export interface DashboardResponsesPage {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: readonly DashboardResponseListItem[];
}

export interface DashboardResponseDetailItem {
  labelEn: string;
  labelAr: string | null;
  value: string;
  selectedOptionTextEn: string | null;
  selectedOptionTextAr: string | null;
  type: string;
  voiceUrl: string | null;
  imageUrl: string | null;
  children: readonly DashboardResponseDetailItem[];
}

export interface DashboardResponseDetails {
  responseId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchNameEn: string;
  branchNameAr: string | null;
  operatorNameEn: string | null;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number | null;
  isScored: boolean;
  customInputs: readonly DashboardResponseDetailItem[];
  answers: readonly DashboardResponseDetailItem[];
}
