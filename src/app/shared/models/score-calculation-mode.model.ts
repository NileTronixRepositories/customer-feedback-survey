export type ScoreCalculationMode =
  | 'RootQuestions'
  | 'LowestConditionLevel'
  | 'AllAnsweredQuestions';

export interface ScoreCalculationModeOption {
  value: ScoreCalculationMode;
  code: number;
  labelKey: string;
  labelEn: string;
  labelAr: string;
}

export const SCORE_CALCULATION_MODES: readonly ScoreCalculationModeOption[] = [
  {
    value: 'RootQuestions',
    code: 1,
    labelKey: 'scoreMode.rootQuestions',
    labelEn: 'Root Questions',
    labelAr: 'الأسئلة الرئيسية',
  },
  {
    value: 'LowestConditionLevel',
    code: 2,
    labelKey: 'scoreMode.lowestConditionLevel',
    labelEn: 'Lowest Condition Level',
    labelAr: 'أعمق مستوى شرطي',
  },
  {
    value: 'AllAnsweredQuestions',
    code: 3,
    labelKey: 'scoreMode.allAnsweredQuestions',
    labelEn: 'All Answered Questions',
    labelAr: 'جميع الأسئلة المجاب عنها',
  },
] as const;

export function parseScoreCalculationMode(value: unknown): ScoreCalculationMode {
  if (value === 2 || value === '2' || value === 'LowestConditionLevel') {
    return 'LowestConditionLevel';
  }
  if (value === 3 || value === '3' || value === 'AllAnsweredQuestions') {
    return 'AllAnsweredQuestions';
  }
  return 'RootQuestions';
}

export function toScoreCalculationModeCode(
  mode: ScoreCalculationMode | string | number | undefined | null,
): number {
  if (mode === 2 || mode === '2' || mode === 'LowestConditionLevel') {
    return 2;
  }
  if (mode === 3 || mode === '3' || mode === 'AllAnsweredQuestions') {
    return 3;
  }
  return 1;
}
