import { ScoreCalculationMode } from '../../../../shared/models/score-calculation-mode.model';

export interface BranchSatisfactionReportQuery {
  from?: string;
  to?: string;
  templateId?: string;
  scoreCalculationMode?: ScoreCalculationMode;
}

export interface BranchSatisfactionReport {
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
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  score: number;
  responsesCount: number;
  scoredAnswersCount: number;
}

export interface SatisfactionTrendItem {
  date: string;
  score: number;
  responsesCount: number;
}

export interface SatisfactionComplaints {
  count: number;
  percentageOfResponses: number;
}

export interface BranchSatisfactionReportApiResponse {
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
