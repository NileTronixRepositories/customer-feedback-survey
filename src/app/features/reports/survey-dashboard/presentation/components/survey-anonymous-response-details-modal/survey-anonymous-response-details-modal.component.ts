import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  Calendar,
  ChartColumnIncreasing,
  CheckCircle2,
  CircleGauge,
  FileText,
  Hash,
  Image as ImageIcon,
  ListChecks,
  MessageSquareText,
  Mic,
  Star,
} from 'lucide-angular';
import { environment } from '../../../../../../../environments/environment';
import { I18nService } from '../../../../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  toQuestionAnswerType,
} from '../../../../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';

import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../../shared/ui/modal/modal.component';
import {
  AnonymousTemplateResponseAnswer,
  AnonymousTemplateResponseCustomInputValue,
  AnonymousTemplateResponseDetails,
} from '../../../../../anonymous-templates/domain/anonymous-template.model';

interface AnonymousResponseAnswerTreeNode {
  readonly answer: AnonymousTemplateResponseAnswer;
  readonly children: readonly AnonymousResponseAnswerTreeNode[];
}

@Component({
  selector: 'app-survey-anonymous-response-details-modal',
  standalone: true,
  imports: [

    DatePipe,
    DecimalPipe,
    IconComponent,
    ModalComponent,
    NgTemplateOutlet,
    TranslatePipe,
  ],
  templateUrl: './survey-anonymous-response-details-modal.component.html',
  styleUrl: './survey-anonymous-response-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyAnonymousResponseDetailsModalComponent {
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly details = input<AnonymousTemplateResponseDetails | null>(null);
  readonly closed = output<void>();
  readonly answerTree = computed<readonly AnonymousResponseAnswerTreeNode[]>(() =>
    this.toAnswerTree(this.details()?.answers ?? []),
  );

  readonly calendarIcon = Calendar;
  readonly chartIcon = ChartColumnIncreasing;
  readonly checkCircleIcon = CheckCircle2;
  readonly fileIcon = FileText;
  readonly gaugeIcon = CircleGauge;
  readonly hashIcon = Hash;
  readonly imageIcon = ImageIcon;
  readonly listChecksIcon = ListChecks;
  readonly messageIcon = MessageSquareText;
  readonly micIcon = Mic;
  readonly starIcon = Star;

  readonly scaleSlots = [1, 2, 3, 4, 5];

  responseTitle(response: AnonymousTemplateResponseDetails): string {
    return this.localized(response.templateNameEn, response.templateNameAr);
  }

  customInputLabel(input: AnonymousTemplateResponseCustomInputValue): string {
    return this.localized(input.labelEn || input.nameSnapshot || input.name, input.labelAr);
  }

  questionText(answer: AnonymousTemplateResponseAnswer): string {
    return this.localized(answer.questionTextEn, answer.questionTextAr);
  }

  scoreBadgeLabel(response: AnonymousTemplateResponseDetails): string {
    if (!response.isScored) {
      return this.i18n.translate('surveyDashboard.notScored');
    }
    const percent = response.scorePercentage ?? 0;
    return `${this.i18n.translate('surveyDashboard.scored')} - ${percent.toFixed(1)}%`;
  }

  questionTypeLabel(answer: AnonymousTemplateResponseAnswer): string {
    return answer.questionTypeName || '-';
  }

  isSingleChoice(answer: AnonymousTemplateResponseAnswer): boolean {
    return toQuestionAnswerType(answer.questionTypeName || answer.questionType) === QUESTION_ANSWER_TYPE.SingleChoice;
  }

  isStarRating(answer: AnonymousTemplateResponseAnswer): boolean {
    return toQuestionAnswerType(answer.questionTypeName || answer.questionType) === QUESTION_ANSWER_TYPE.StarRating;
  }

  isSmiles(answer: AnonymousTemplateResponseAnswer): boolean {
    return toQuestionAnswerType(answer.questionTypeName || answer.questionType) === QUESTION_ANSWER_TYPE.Smiles;
  }

  isComplain(answer: AnonymousTemplateResponseAnswer): boolean {
    return toQuestionAnswerType(answer.questionTypeName || answer.questionType) === QUESTION_ANSWER_TYPE.Complain;
  }

  isVoice(answer: AnonymousTemplateResponseAnswer): boolean {
    return toQuestionAnswerType(answer.questionTypeName || answer.questionType) === QUESTION_ANSWER_TYPE.Voice;
  }

  isImage(answer: AnonymousTemplateResponseAnswer): boolean {
    return toQuestionAnswerType(answer.questionTypeName || answer.questionType) === QUESTION_ANSWER_TYPE.Image;
  }

  isStarActive(slot: number, value: number | null): boolean {
    return slot <= (value ?? 0);
  }

  customInputTypeLabel(typeName: string): string {
    if (typeName.toLowerCase().includes('int') || typeName.toLowerCase().includes('num')) {
      return this.i18n.translate('surveyDashboard.typeInteger');
    }
    return this.i18n.translate('surveyDashboard.typeString');
  }

  answerDisplayValue(answer: AnonymousTemplateResponseAnswer): string {
    const answerType = toQuestionAnswerType(answer.questionTypeName || answer.questionType);
    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return this.localized(answer.selectedOptionTextEn ?? '', answer.selectedOptionTextAr);
    }
    if (answerType === QUESTION_ANSWER_TYPE.StarRating) {
      return answer.starRatingValue === null ? '-' : `${answer.starRatingValue} / 5`;
    }
    if (answerType === QUESTION_ANSWER_TYPE.Smiles) {
      return answer.smileValue === null ? '-' : `${answer.smileValue} / 5`;
    }
    if (answerType === QUESTION_ANSWER_TYPE.Complain) {
      return answer.textAnswer?.trim() || '-';
    }
    if (answerType === QUESTION_ANSWER_TYPE.Image) {
      return answer.imageFileName?.trim() || answer.imageFileUrl?.trim() || '-';
    }

    return answer.voiceFileName?.trim() || answer.voiceUrl?.trim() || '-';
  }

  customInputDisplayValue(input: AnonymousTemplateResponseCustomInputValue): string {
    return input.displayValue || input.stringValue || (input.integerValue === null ? '-' : String(input.integerValue));
  }

  voiceUrl(answer: AnonymousTemplateResponseAnswer): string {
    return this.toMediaUrl(answer.voiceUrl);
  }

  imageUrl(answer: AnonymousTemplateResponseAnswer): string {
    return this.toMediaUrl(answer.imageFileUrl);
  }

  localized(englishText: string | null | undefined, arabicText: string | null | undefined): string {
    const english = englishText?.trim() ?? '';
    const arabic = arabicText?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabic || english || '-';
    }

    return english || arabic || '-';
  }

  private toMediaUrl(url: string | null): string {
    if (!url) {
      return '';
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${path}`;
  }

  private toAnswerTree(
    answers: readonly AnonymousTemplateResponseAnswer[],
  ): readonly AnonymousResponseAnswerTreeNode[] {
    return answers.map((answer) => ({
      answer,
      children: this.toAnswerTree(answer.children),
    }));
  }
}
