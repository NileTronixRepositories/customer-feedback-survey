export interface BranchEvaluationSettings {
  branchId: string;
  neutralMinimum: number;
  satisfiedMinimum: number;
  mediumRiskMinimum: number;
  healthyMinimum: number;
  updatedOnUtc: string | null;
  usesDefaults: boolean;
}

export interface UpdateBranchEvaluationSettingsRequest {
  neutralMinimum: number;
  satisfiedMinimum: number;
  mediumRiskMinimum: number;
  healthyMinimum: number;
}

export function validateBranchEvaluationSettings(
  request: UpdateBranchEvaluationSettingsRequest,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const { neutralMinimum, satisfiedMinimum, mediumRiskMinimum, healthyMinimum } = request;

  if (neutralMinimum < 0 || neutralMinimum > 100) {
    errors.push('branchEvaluationSettings.errors.neutralRange');
  }
  if (satisfiedMinimum < 0 || satisfiedMinimum > 100) {
    errors.push('branchEvaluationSettings.errors.satisfiedRange');
  }
  if (neutralMinimum >= satisfiedMinimum) {
    errors.push('branchEvaluationSettings.errors.neutralLessThanSatisfied');
  }

  if (mediumRiskMinimum < 0 || mediumRiskMinimum > 100) {
    errors.push('branchEvaluationSettings.errors.mediumRiskRange');
  }
  if (healthyMinimum < 0 || healthyMinimum > 100) {
    errors.push('branchEvaluationSettings.errors.healthyRange');
  }
  if (mediumRiskMinimum >= healthyMinimum) {
    errors.push('branchEvaluationSettings.errors.mediumRiskLessThanHealthy');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
