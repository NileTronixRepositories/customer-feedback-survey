import { DashboardDetailsNavigation } from '../../features/reports/dashboard-drill-down/domain/dashboard-drill-down.model';

export type ClassificationPolicy =
  | 'Standard'
  | 'Strict'
  | 'Lenient'
  | string;

export type HistoricalDataProvenance =
  | 'CapturedAtSubmission'
  | 'LegacyReconstructed'
  | 'LegacyIncomplete'
  | 1
  | 2
  | 3
  | string;

export interface HistoricalSurveyOption {
  optionId: string;
  value: number;
  textEn: string;
  textAr: string | null;
}

export interface HistoricalSurveyQuestion {
  templateQuestionId: string;
  questionId: string;
  type: string;
  textEn: string;
  textAr: string | null;
  order: number | null;
  groupId: string | null;
  groupNameEn: string | null;
  groupNameAr: string | null;
  isRoot: boolean;
  isVisible: boolean;
  isRequired: boolean;
  hasAnswer: boolean;
  selectedQuestionOptionId: string | null;
  selectedOptionValue: number | null;
  selectedOptionTextEn: string | null;
  selectedOptionTextAr: string | null;
  starRatingValue: number | null;
  smileValue: number | null;
  textAnswer: string | null;
  voiceFileName: string | null;
  imageFileName: string | null;
  options: readonly HistoricalSurveyOption[];
}

export interface HistoricalSurveyCondition {
  conditionId: string;
  parentQuestionId: string;
  childQuestionId: string;
  triggerType: string;
  triggerOptionId: string | null;
  triggerValue: number | null;
}

export interface HistoricalSurveyCustomInputDefinition {
  customInputId: string;
  labelEn: string | null;
  labelAr: string | null;
  type: string;
  order: number;
  value?: string | null;
}

export interface HistoricalSurvey {
  schemaVersion?: string | number;
  responseId: string;
  templateId: string;
  templateKind: string | number;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string | null;
  operatorId: string | null;
  submittedOnUtc: string;
  actualScore: number;
  maxScore: number;
  scorePercentage: number;
  provenance: HistoricalDataProvenance;
  isHistoricallyVerified: boolean;
  questions: readonly HistoricalSurveyQuestion[];
  conditions: readonly HistoricalSurveyCondition[];
  customInputDefinitions: readonly HistoricalSurveyCustomInputDefinition[];
}

export interface HistoricalAvailability {
  availableTemplatesDuringPeriod: number;
  templatesWithResponsesCount: number;
  currentlyAvailableTemplatesCount: number;
  isHistoryComplete: boolean;
  coverageStartsOnUtc: string | null;
}

export interface BestRatedQuestion {
  templateId: string;
  templateNameEn?: string;
  templateNameAr?: string | null;
  branchId?: string;
  branchNameEn?: string;
  branchNameAr?: string | null;
  questionId: string;
  anonymousTemplateQuestionId?: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: string | number;
  questionTypeName: string;
  answersCount: number;
  averageValue: number | null;
  averageScorePercentage: number | null;
  detailsNavigation: DashboardDetailsNavigation | null;
}
