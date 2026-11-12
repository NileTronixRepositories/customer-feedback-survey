import { DashboardDetailsNavigation } from '../../../reports/dashboard-drill-down/domain/dashboard-drill-down.model';
import { ScoreCalculationMode } from '../../../../shared/models/score-calculation-mode.model';

export interface BranchSatisfactionReportQuery {
  from?: string;
  to?: string;
  templateId?: string;
  scoreCalculationMode?: ScoreCalculationMode;
}

export interface BranchSatisfactionReport {
  feedbackByTemplate?: readonly SatisfactionFeedbackByTemplate[];
  suggestionsNavigation?: DashboardDetailsNavigation | null;
  commentsNavigation?: DashboardDetailsNavigation | null;
  period: SatisfactionReportPeriod;
  overall: SatisfactionOverall;
  distribution: readonly SatisfactionDistributionItem[];
  byTemplate: readonly SatisfactionByTemplateItem[];
  trend: readonly SatisfactionTrendItem[];
  complaints: SatisfactionComplaints;
  scoreCalculationMode?: ScoreCalculationMode;
  requestedModeAvailable?: boolean;
  storedBaselineResponsesCount?: number;
}

export interface SatisfactionReportPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  periodSource: 'UserProvided' | 'LastSixMonths' | 'TemplateCreatedOn' | string;
}

export interface SatisfactionOverall {
  score: number;
  totalResponses: number;
  scoredResponses: number;
  unscoredResponses: number;
  totalScoredAnswers: number;
  satisfiedResponses: number;
  neutralResponses: number;
  unsatisfiedResponses: number;
  complaintsCount: number;
  suggestionsCount?: number;
  commentsCount?: number;
  voiceAnswersCount: number;
  hasScoreData?: boolean;
  satisfactionPercentage?: number | null;
}

export interface SatisfactionDistributionItem {
  value: number;
  labelEn: string;
  labelAr: string;
  count: number;
  percentage: number;
}

export interface SatisfactionByTemplateItem {
  complaintsCount?: number;
  suggestionsCount?: number;
  commentsCount?: number;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  score: number;
  responsesCount: number;
  scoredAnswersCount: number;
}

export interface SatisfactionTrendItem {
  detailsNavigation?: DashboardDetailsNavigation | null;
  date: string;
  score: number;
  responsesCount: number;
}

export interface SatisfactionComplaints {
  responsesWithComplaints?: number;
  detailsNavigation?: DashboardDetailsNavigation | null;
  count: number;
  percentageOfResponses: number;
}

export interface SatisfactionFeedbackByTemplate {
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  responsesCount: number;
  complaintsCount: number;
  suggestionsCount: number;
  commentsCount: number;
}

export interface BranchSatisfactionReportApiResponse {
  feedbackByTemplate?: readonly SatisfactionFeedbackByTemplate[];
  suggestionsNavigation?: DashboardDetailsNavigation | null;
  commentsNavigation?: DashboardDetailsNavigation | null;
  period?: Partial<SatisfactionReportPeriod>;
  overall?: Partial<SatisfactionOverall>;
  distribution?: readonly Partial<SatisfactionDistributionItem>[];
  byTemplate?: readonly Partial<SatisfactionByTemplateItem>[];
  trend?: readonly Partial<SatisfactionTrendItem>[];
  complaints?: Partial<SatisfactionComplaints>;
  scoreCalculationMode?: ScoreCalculationMode;
  requestedModeAvailable?: boolean;
  storedBaselineResponsesCount?: number;
}
