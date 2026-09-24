import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Eye,
  FileAudio,
  GitBranch,
  Info,
  Lock,
  RotateCcw,
  Sparkles,
  Star,
  Zap,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  QuestionAnswerOption,
  QuestionAnswerType,
  SMILE_LEVELS,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from '../../../../../../shared/models/question-answer.model';
import {
  ConditionalQuestionAnswerState,
  QUESTION_CONDITION_TRIGGER_TYPE,
  QuestionCondition,
  buildVisibleQuestionIds,
  buildVisibleQuestionOrder,
  isQuestionConditionMatch,
} from '../../../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { BranchTemplateQuestionSelectionItem } from '../../../domain/branch-template.model';
import { BranchTemplatesStore } from '../../state/branch-templates.store';

export interface TemplatePreviewQuestion extends BranchTemplateQuestionSelectionItem {
  templateQuestionId: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  groupIsActive: boolean;
  answerType: QuestionAnswerType | null;
}

export interface TemplatePreviewAnswerDraft extends ConditionalQuestionAnswerState {
  textAnswer: string;
  voiceFileName: string;
}

export interface OptionBranchInfo {
  hasBranch: boolean;
  childCount: number;
  isActive: boolean;
  childQuestionNames: string[];
}

export interface ValueBranchInfo {
  hasBranch: boolean;
  childCount: number;
  isActive: boolean;
}

export interface QuestionConditionSourceInfo {
  isConditional: boolean;
  parentQuestion?: TemplatePreviewQuestion;
  parentIndex?: number;
  parentText?: string;
  triggerText?: string;
  isSatisfied: boolean;
}

export interface LogicMapRuleItem {
  condition: QuestionCondition;
  parentQuestion: TemplatePreviewQuestion;
  childQuestion: TemplatePreviewQuestion;
  parentIndex: number;
  childIndex: number;
  triggerDescription: string;
  isSatisfied: boolean;
}

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-branch-template-preview',
  standalone: true,
  imports: [ButtonComponent, IconComponent, TranslatePipe],
  templateUrl: './branch-template-preview.component.html',
  styleUrl: './branch-template-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplatePreviewComponent {
  readonly templatesStore = inject(BranchTemplatesStore);
  readonly i18n = inject(I18nService);

  readonly fileAudioIcon = FileAudio;
  readonly resetIcon = RotateCcw;
  readonly starIcon = Star;
  readonly gitBranchIcon = GitBranch;
  readonly cornerDownRightIcon = CornerDownRight;
  readonly checkCircleIcon = CheckCircle2;
  readonly lockIcon = Lock;
  readonly eyeIcon = Eye;
  readonly infoIcon = Info;
  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;
  readonly sparklesIcon = Sparkles;
  readonly zapIcon = Zap;

  readonly ratingValues = SCALE_VALUES;
  readonly smileLevels = SMILE_LEVELS;

  readonly answers = signal<Record<string, TemplatePreviewAnswerDraft>>({});
  readonly viewMode = signal<'realistic' | 'flow'>('realistic');
  readonly showLogicMap = signal<boolean>(false);
  readonly highlightedQuestionId = signal<string | null>(null);

  private readonly initializedPreviewKey = signal('');

  readonly selectedQuestions = computed<readonly TemplatePreviewQuestion[]>(() =>
    this.flattenSelectedQuestions(),
  );

  readonly questionConditions = computed<readonly QuestionCondition[]>(
    () => this.templatesStore.questionsSelection()?.questionConditions ?? [],
  );

  readonly questionsMap = computed(() => {
    return new Map(this.selectedQuestions().map((q) => [q.templateQuestionId, q]));
  });

  readonly questionsOrderMap = computed(() => {
    const orderMap = new Map<string, number>();
    this.selectedQuestions().forEach((q, idx) => {
      orderMap.set(q.templateQuestionId, idx + 1);
    });
    return orderMap;
  });

  readonly visibleQuestionOrder = computed(() =>
    buildVisibleQuestionOrder(
      this.selectedQuestions().map((question) => ({
        templateQuestionId: question.templateQuestionId,
        order: question.order,
      })),
      this.questionConditions(),
      this.answers(),
    ),
  );

  readonly visibleQuestions = computed<readonly TemplatePreviewQuestion[]>(() => {
    const questionsByTemplateQuestionId = this.questionsMap();

    return this.visibleQuestionOrder()
      .map((templateQuestionId) => questionsByTemplateQuestionId.get(templateQuestionId))
      .filter((question): question is TemplatePreviewQuestion => question !== undefined);
  });

  readonly visibleQuestionIdsSet = computed(() => new Set(this.visibleQuestionOrder()));

  readonly hiddenQuestionsCount = computed(
    () => this.selectedQuestions().length - this.visibleQuestions().length,
  );

  readonly rootQuestions = computed(() =>
    this.selectedQuestions().filter((q) => !this.isConditionalQuestion(q.templateQuestionId)),
  );

  readonly conditionalQuestions = computed(() =>
    this.selectedQuestions().filter((q) => this.isConditionalQuestion(q.templateQuestionId)),
  );

  readonly logicMapRules = computed<readonly LogicMapRuleItem[]>(() => {
    const questionsMap = this.questionsMap();
    const orderMap = this.questionsOrderMap();
    const currentAnswers = this.answers();
    const isArabic = this.i18n.language() === 'ar';

    return this.questionConditions()
      .map((condition): LogicMapRuleItem | null => {
        const parent = questionsMap.get(condition.parentTemplateQuestionId);
        const child = questionsMap.get(condition.childTemplateQuestionId);
        if (!parent || !child) {
          return null;
        }

        let triggerDescription = '';
        if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
          const option = parent.options.find((opt) => opt.optionId === condition.selectedQuestionOptionId);
          triggerDescription = option ? this.optionLabel(option) : '-';
        } else if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
          triggerDescription = `${condition.triggerValue ?? ''} ${this.i18n.translate('branchTemplates.stars')}`;
        } else if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue) {
          const smile = this.smileLevels.find((s) => s.value === condition.triggerValue);
          triggerDescription = smile ? `${smile.emoji} ${this.i18n.translate(smile.labelKey)}` : '-';
        }

        const parentAnswer = currentAnswers[parent.templateQuestionId] ?? this.createEmptyDraft();
        const isSatisfied = isQuestionConditionMatch(condition, parentAnswer);

        return {
          condition,
          parentQuestion: parent,
          childQuestion: child,
          parentIndex: orderMap.get(parent.templateQuestionId) ?? 1,
          childIndex: orderMap.get(child.templateQuestionId) ?? 1,
          triggerDescription,
          isSatisfied,
        };
      })
      .filter((item): item is LogicMapRuleItem => item !== null);
  });

  readonly activeLogicMapRulesCount = computed(
    () => this.logicMapRules().filter((rule) => rule.isSatisfied).length,
  );

  constructor() {
    effect(() => {
      const selection = this.templatesStore.questionsSelection();
      if (!selection) {
        this.answers.set({});
        this.initializedPreviewKey.set('');
        return;
      }

      const previewKey = [
        selection.templateId,
        this.selectedQuestions()
          .map((question) => question.templateQuestionId)
          .join('|'),
        selection.questionConditions
          .map(
            (condition) =>
              `${condition.parentTemplateQuestionId}|${condition.childTemplateQuestionId}|${condition.triggerType}|${condition.selectedQuestionOptionId ?? ''}|${condition.triggerValue ?? ''}`,
          )
          .sort()
          .join('::'),
      ].join('::');

      if (previewKey === this.initializedPreviewKey()) {
        return;
      }

      this.answers.set({});
      this.initializedPreviewKey.set(previewKey);
    });
  }

  resetPreview(): void {
    this.answers.set({});
  }

  setViewMode(mode: 'realistic' | 'flow'): void {
    this.viewMode.set(mode);
  }

  toggleLogicMap(): void {
    this.showLogicMap.update((v) => !v);
  }

  isConditionalQuestion(questionId: string): boolean {
    return this.questionConditions().some((c) => c.childTemplateQuestionId === questionId);
  }

  getConditionSourceInfo(question: TemplatePreviewQuestion): QuestionConditionSourceInfo {
    const condition = this.questionConditions().find(
      (c) => c.childTemplateQuestionId === question.templateQuestionId,
    );
    if (!condition) {
      return { isConditional: false, isSatisfied: true };
    }

    const parent = this.questionsMap().get(condition.parentTemplateQuestionId);
    const parentIndex = this.questionsOrderMap().get(condition.parentTemplateQuestionId) ?? 1;
    const parentText = parent ? this.questionText(parent) : '';

    let triggerText = '';
    if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
      const opt = parent?.options.find((o) => o.optionId === condition.selectedQuestionOptionId);
      triggerText = opt ? this.optionLabel(opt) : '-';
    } else if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
      triggerText = `${condition.triggerValue ?? ''} ${this.i18n.translate('branchTemplates.stars')}`;
    } else if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue) {
      const smile = this.smileLevels.find((s) => s.value === condition.triggerValue);
      triggerText = smile ? `${smile.emoji} ${this.i18n.translate(smile.labelKey)}` : '-';
    }

    const parentAnswer = this.answers()[condition.parentTemplateQuestionId] ?? this.createEmptyDraft();
    const isSatisfied = isQuestionConditionMatch(condition, parentAnswer);

    return {
      isConditional: true,
      parentQuestion: parent,
      parentIndex,
      parentText,
      triggerText,
      isSatisfied,
    };
  }

  getOptionBranchInfo(question: TemplatePreviewQuestion, optionId: string): OptionBranchInfo {
    const matching = this.questionConditions().filter(
      (c) =>
        c.parentTemplateQuestionId === question.templateQuestionId &&
        c.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption &&
        c.selectedQuestionOptionId === optionId,
    );

    const questionsMap = this.questionsMap();
    const childQuestionNames = matching
      .map((c) => {
        const childQ = questionsMap.get(c.childTemplateQuestionId);
        return childQ ? this.questionText(childQ) : '';
      })
      .filter((name) => name.length > 0);

    return {
      hasBranch: matching.length > 0,
      childCount: matching.length,
      isActive: this.selectedOptionId(question) === optionId,
      childQuestionNames,
    };
  }

  getStarBranchInfo(question: TemplatePreviewQuestion, value: number): ValueBranchInfo {
    const matching = this.questionConditions().filter(
      (c) =>
        c.parentTemplateQuestionId === question.templateQuestionId &&
        c.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue &&
        c.triggerValue === value,
    );

    return {
      hasBranch: matching.length > 0,
      childCount: matching.length,
      isActive: this.starRatingValue(question) === value,
    };
  }

  getSmileBranchInfo(question: TemplatePreviewQuestion, value: number): ValueBranchInfo {
    const matching = this.questionConditions().filter(
      (c) =>
        c.parentTemplateQuestionId === question.templateQuestionId &&
        c.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue &&
        c.triggerValue === value,
    );

    return {
      hasBranch: matching.length > 0,
      childCount: matching.length,
      isActive: this.smileValue(question) === value,
    };
  }

  isCompactOptionGrid(question: TemplatePreviewQuestion): boolean {
    if (question.options.length > 5) {
      return false;
    }
    return !question.options.some(
      (opt) => (opt.textAr?.length ?? 0) > 35 || (opt.textEn?.length ?? 0) > 35,
    );
  }

  optionsGridClass(question: TemplatePreviewQuestion): string {
    const count = question.options.length;
    if (this.isCompactOptionGrid(question)) {
      if (count <= 2) {
        return 'grid grid-cols-1 sm:grid-cols-2 gap-2.5';
      }
      if (count === 3) {
        return 'grid grid-cols-1 sm:grid-cols-3 gap-2.5';
      }
      if (count === 4) {
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5';
      }
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5';
    }

    return 'grid grid-cols-1 md:grid-cols-2 gap-2.5';
  }

  testConditionRule(rule: LogicMapRuleItem): void {
    const { condition, parentQuestion, childQuestion } = rule;

    if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
      this.updateAnswer(parentQuestion.templateQuestionId, {
        selectedQuestionOptionId: condition.selectedQuestionOptionId ?? '',
      });
    } else if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
      this.updateAnswer(parentQuestion.templateQuestionId, {
        starRatingValue: condition.triggerValue ?? 5,
      });
    } else if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue) {
      this.updateAnswer(parentQuestion.templateQuestionId, {
        smileValue: condition.triggerValue ?? 5,
      });
    }

    this.highlightedQuestionId.set(childQuestion.templateQuestionId);

    setTimeout(() => {
      const el = document.getElementById('preview-q-' + childQuestion.templateQuestionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    setTimeout(() => {
      if (this.highlightedQuestionId() === childQuestion.templateQuestionId) {
        this.highlightedQuestionId.set(null);
      }
    }, 3500);
  }

  isQuestionHighlighted(question: TemplatePreviewQuestion): boolean {
    return this.highlightedQuestionId() === question.templateQuestionId;
  }

  selectSingleChoice(question: TemplatePreviewQuestion, optionId: string): void {
    const wasAlreadySelected = this.selectedOptionId(question) === optionId;
    this.updateAnswer(question.templateQuestionId, {
      selectedQuestionOptionId: wasAlreadySelected ? '' : optionId,
    });
  }

  selectStarRating(question: TemplatePreviewQuestion, value: number): void {
    const wasAlreadySelected = this.starRatingValue(question) === value;
    this.updateAnswer(question.templateQuestionId, {
      starRatingValue: wasAlreadySelected ? null : value,
    });
  }

  selectSmileValue(question: TemplatePreviewQuestion, value: number): void {
    const wasAlreadySelected = this.smileValue(question) === value;
    this.updateAnswer(question.templateQuestionId, {
      smileValue: wasAlreadySelected ? null : value,
    });
  }

  updateTextAnswer(question: TemplatePreviewQuestion, event: Event): void {
    const target = event.target;
    this.updateAnswer(question.templateQuestionId, {
      textAnswer: target instanceof HTMLTextAreaElement ? target.value : '',
    });
  }

  updateVoiceFile(question: TemplatePreviewQuestion, event: Event): void {
    const target = event.target;
    const voiceFileName = target instanceof HTMLInputElement ? target.files?.[0]?.name ?? '' : '';
    this.updateAnswer(question.templateQuestionId, { voiceFileName });

    if (target instanceof HTMLInputElement) {
      target.value = '';
    }
  }

  selectedOptionId(question: TemplatePreviewQuestion): string {
    return this.answerDraft(question).selectedQuestionOptionId;
  }

  starRatingValue(question: TemplatePreviewQuestion): number | null {
    return this.answerDraft(question).starRatingValue;
  }

  smileValue(question: TemplatePreviewQuestion): number | null {
    return this.answerDraft(question).smileValue;
  }

  textAnswer(question: TemplatePreviewQuestion): string {
    return this.answerDraft(question).textAnswer;
  }

  voiceFileName(question: TemplatePreviewQuestion): string {
    return this.answerDraft(question).voiceFileName;
  }

  questionText(question: TemplatePreviewQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(question.textEn, question.textAr, isArabic) || '-';
  }

  questionGroupName(question: TemplatePreviewQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(question.groupNameEn, question.groupNameAr, isArabic);
  }

  optionLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(option.textEn, option.textAr ?? '', isArabic) || '-';
  }

  answerTypeLabel(question: TemplatePreviewQuestion): string {
    const labelKey = questionAnswerTypeLabelKey(question.type);
    return labelKey ? this.i18n.translate(labelKey) : question.type || '-';
  }

  isSingleChoice(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.SingleChoice;
  }

  isVoice(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Voice;
  }

  isStarRating(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.StarRating;
  }

  isComplain(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Complain;
  }

  isSmiles(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Smiles;
  }

  displayedQuestions(): readonly TemplatePreviewQuestion[] {
    if (this.viewMode() === 'flow') {
      return this.selectedQuestions();
    }
    return this.visibleQuestions();
  }

  isQuestionUnlocked(question: TemplatePreviewQuestion): boolean {
    return this.visibleQuestionIdsSet().has(question.templateQuestionId);
  }

  private updateAnswer(
    templateQuestionId: string,
    patch: Partial<TemplatePreviewAnswerDraft>,
  ): void {
    this.answers.update((answers) => {
      const nextAnswers = {
        ...answers,
        [templateQuestionId]: {
          ...(answers[templateQuestionId] ?? this.createEmptyDraft()),
          ...patch,
        },
      };

      return this.removeHiddenAnswers(nextAnswers);
    });
  }

  private answerDraft(question: TemplatePreviewQuestion): TemplatePreviewAnswerDraft {
    return this.answers()[question.templateQuestionId] ?? this.createEmptyDraft();
  }

  private createEmptyDraft(): TemplatePreviewAnswerDraft {
    return {
      selectedQuestionOptionId: '',
      starRatingValue: null,
      smileValue: null,
      textAnswer: '',
      voiceFileName: '',
    };
  }

  private removeHiddenAnswers(
    answers: Record<string, TemplatePreviewAnswerDraft>,
  ): Record<string, TemplatePreviewAnswerDraft> {
    const visibleIds = buildVisibleQuestionIds(
      this.selectedQuestions().map((question) => ({
        templateQuestionId: question.templateQuestionId,
        order: question.order,
      })),
      this.questionConditions(),
      answers,
    );

    return Object.fromEntries(
      Object.entries(answers).filter(([templateQuestionId]) => visibleIds.has(templateQuestionId)),
    );
  }

  private flattenSelectedQuestions(): readonly TemplatePreviewQuestion[] {
    return (
      this.templatesStore.questionsSelection()?.groups
        .flatMap((group) =>
          group.questions.map((question) => ({
            ...question,
            groupId: group.groupId,
            groupNameEn: group.nameEn,
            groupNameAr: group.nameAr,
            groupIsActive: group.isActive,
          })),
        )
        .filter(
          (question): question is TemplatePreviewQuestion =>
            question.isSelected &&
            question.isActive &&
            question.groupIsActive &&
            question.templateQuestionId !== null &&
            question.templateQuestionId.length > 0,
        )
        .map((question) => ({
          ...question,
          answerType: toQuestionAnswerType(question.type),
        }))
        .sort(
          (first, second) =>
            (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER),
        ) ?? []
    );
  }

  private localizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic && arabicText.length > 0) {
      return arabicText;
    }
    return englishText || arabicText;
  }
}
