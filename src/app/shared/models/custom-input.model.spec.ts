import { describe, expect, it } from 'vitest';
import {
  customInputDisplayValue,
  customInputHtmlType,
  isSystemCustomInput,
  isValidDateOnly,
  normalizeCustomInputType,
} from './custom-input.model';

describe('custom input contracts', () => {
  it.each([3, '3', 'Date', ' date '])('recognizes Date metadata %s', (type) => {
    expect(normalizeCustomInputType(type)).toBe(3);
    expect(customInputHtmlType(normalizeCustomInputType(type))).toBe('date');
  });

  it.each(['2026-11-08', '2024-02-29', '2000-02-29'])('keeps valid calendar dates: %s', (value) => {
    expect(isValidDateOnly(value)).toBe(true);
  });

  it.each([
    '2026-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-13-01',
    '0000-01-01',
    '2026-1-08',
    '2026-11-08T00:00:00Z',
    '',
  ])('rejects invalid date-only values: %s', (value) => {
    expect(isValidDateOnly(value)).toBe(false);
  });

  it('uses declared historical types without guessing from populated values', () => {
    expect(
      customInputDisplayValue({ type: 3, dateValue: '2026-11-08', stringValue: 'wrong' }),
    ).toBe('2026-11-08');
    expect(customInputDisplayValue({ type: 1, typeSnapshot: 3, dateValue: '2026-11-08' })).toBe(
      '2026-11-08',
    );
    expect(customInputDisplayValue({ type: 3, stringValue: 'wrong' })).toBe('');
    expect(customInputDisplayValue({ type: 2, integerValue: 0 })).toBe('0');
    expect(customInputDisplayValue({ value: 'legacy preview' })).toBe('legacy preview');
  });

  it('protects system identity independently of its translated label', () => {
    expect(isSystemCustomInput({ isSystemField: true })).toBe(true);
    expect(isSystemCustomInput({ systemFieldKey: 'VisitTime' })).toBe(true);
    expect(isSystemCustomInput({ isSystemField: false })).toBe(false);
  });
});
