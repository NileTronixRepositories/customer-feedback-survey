import { describe, expect, it } from 'vitest';
import {
  QUESTION_ANSWER_TYPE,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from './question-answer.model';

describe('question answer types', () => {
  it('keeps FreeText distinct from Complain', () => {
    expect(toQuestionAnswerType(7)).toBe(QUESTION_ANSWER_TYPE.FreeText);
    expect(toQuestionAnswerType('FreeText')).toBe(QUESTION_ANSWER_TYPE.FreeText);
    expect(toQuestionAnswerType('textarea')).toBe(QUESTION_ANSWER_TYPE.FreeText);
    expect(toQuestionAnswerType('Complain')).toBe(QUESTION_ANSWER_TYPE.Complain);
  });

  it('uses the FreeText translation key', () => {
    expect(questionAnswerTypeLabelKey(QUESTION_ANSWER_TYPE.FreeText)).toBe(
      'questions.typeFreeText',
    );
  });
});
