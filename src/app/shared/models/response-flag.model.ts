export type SurveyResponseFlagType = 1 | 2 | 3;
export const FLAG_TYPES = [1, 2, 3] as const;
export const FLAG_PERMISSIONS = {
  view: 'ResponseFlags.View',
  create: 'ResponseFlags.Create',
  answer: 'ResponseFlags.Answer',
  editBrief: 'ResponseFlags.EditBrief',
  submit: 'ResponseFlags.CreateOnSubmit',
} as const;
export const FLAG_CAPABILITIES = [
  FLAG_PERMISSIONS.view,
  FLAG_PERMISSIONS.create,
  FLAG_PERMISSIONS.answer,
  FLAG_PERMISSIONS.editBrief,
] as const;

export interface OperatorSurveyFlag {
  type: SurveyResponseFlagType;
  brief?: string | null;
}
export interface FlagActor {
  applicationUserId: string;
  nameEn: string;
  nameAr: string | null;
}
export interface ResponseFlagDetails {
  flagId: string;
  responseId: string;
  type: SurveyResponseFlagType;
  brief: string | null;
  answer: string | null;
  createdBy: FlagActor;
  createdOnUtc: string;
  briefUpdatedBy: FlagActor | null;
  briefUpdatedOnUtc: string | null;
  answeredBy: FlagActor | null;
  answeredOnUtc: string | null;
}
export type ResponseFlagApiDetails = Omit<ResponseFlagDetails, 'type'> & {
  type: SurveyResponseFlagType | 'Complaint' | 'Suggestion' | 'Comment';
};
export function flagType(value: unknown): SurveyResponseFlagType | null {
  switch (String(value).toLowerCase()) {
    case '1':
    case 'complaint':
      return 1;
    case '2':
    case 'suggestion':
      return 2;
    case '3':
    case 'comment':
      return 3;
    default:
      return null;
  }
}
export function flagTypeKey(value: unknown): string {
  const type = flagType(value);
  return type ? `flags.type${type}` : 'flags.type';
}
export function toResponseFlag(value: ResponseFlagApiDetails): ResponseFlagDetails {
  const type = flagType(value.type);
  if (type === null) throw new Error('Unsupported feedback type');
  return { ...value, type };
}
export function operatorFlagsValid(
  flags: readonly { type: unknown; brief?: string | null }[],
): boolean {
  return flags.every(
    (flag) => flagType(flag.type) !== null && (flag.brief?.trim().length ?? 0) <= 1000,
  );
}
