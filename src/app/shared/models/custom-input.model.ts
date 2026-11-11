export enum TemplateCustomInputType {
  String = 1,
  Integer = 2,
  Date = 3,
}

export enum ResponseDateBasis {
  SubmittedOnUtc = 0,
  VisitTime = 1,
}

export interface SystemCustomInputMetadata {
  isSystemField?: boolean;
  systemFieldKey?: string | null;
}

export function isSystemCustomInput(input: SystemCustomInputMetadata): boolean {
  return input.isSystemField === true || input.systemFieldKey === 'VisitTime';
}

export function normalizeCustomInputType(value: unknown): TemplateCustomInputType {
  switch (
    String(value ?? '')
      .trim()
      .toLowerCase()
  ) {
    case '3':
    case 'date':
      return 3;
    case '2':
    case 'integer':
      return 2;
    default:
      return 1;
  }
}

export function customInputHtmlType(type: number): 'text' | 'number' | 'date' {
  return type === 3 ? 'date' : type === 2 ? 'number' : 'text';
}

export function customInputTypeName(type: unknown): 'String' | 'Integer' | 'Date' {
  return normalizeCustomInputType(type) === TemplateCustomInputType.Date
    ? 'Date'
    : normalizeCustomInputType(type) === TemplateCustomInputType.Integer
      ? 'Integer'
      : 'String';
}

/** Validates a calendar date without converting it to a UTC timestamp. */
export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function customInputDisplayValue(input: {
  type?: unknown;
  typeSnapshot?: unknown;
  typeName?: unknown;
  stringValue?: unknown;
  integerValue?: unknown;
  dateValue?: unknown;
  displayValue?: unknown;
  value?: unknown;
}): string {
  const type = normalizeCustomInputType(input.typeSnapshot ?? input.type ?? input.typeName);
  const value = type === 3 ? input.dateValue : type === 2 ? input.integerValue : input.stringValue;
  const display = value ?? input.displayValue ?? input.value;
  return typeof display === 'string' || typeof display === 'number' ? String(display) : '';
}
