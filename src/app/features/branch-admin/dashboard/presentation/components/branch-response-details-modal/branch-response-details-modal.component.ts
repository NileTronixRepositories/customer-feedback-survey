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
  UserRound,
} from 'lucide-angular';
import { environment } from '../../../../../../../environments/environment';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';

import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../../shared/ui/modal/modal.component';
import {
  BranchSurveyResponseAnswer,
  BranchSurveyResponseDetails,
  BranchSurveyResponseScore,
} from '../../../domain/branch-dashboard.model';

interface BranchResponseAnswerTreeNode {
  readonly answer: BranchSurveyResponseAnswer;
  readonly children: readonly BranchResponseAnswerTreeNode[];
}

@Component({
  selector: 'app-branch-response-details-modal',
  standalone: true,
  imports: [

    DatePipe,
    DecimalPipe,
    IconComponent,
    ModalComponent,
    NgTemplateOutlet,
    TranslatePipe,
  ],
  templateUrl: './branch-response-details-modal.component.html',
  styleUrl: './branch-response-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchResponseDetailsModalComponent {
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly details = input<BranchSurveyResponseDetails | null>(null);
  readonly closed = output<void>();
  readonly answerTree = computed<readonly BranchResponseAnswerTreeNode[]>(() =>
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
  readonly userIcon = UserRound;

  readonly scaleSlots = [1, 2, 3, 4, 5];

  templateName(details: BranchSurveyResponseDetails): string {
    return this.localized(details.templateNameEn, details.templateNameAr);
  }

  operatorName(details: BranchSurveyResponseDetails): string {
    return this.localized(details.operatorNameEn, details.operatorNameAr);
  }

  questionText(answer: BranchSurveyResponseAnswer): string {
    return this.localized(answer.questionTextEn, answer.questionTextAr);
  }

  selectedOptionText(answer: BranchSurveyResponseAnswer): string {
    return this.localized(answer.selectedOptionTextEn ?? '', answer.selectedOptionTextAr);
  }

  scoreBadgeLabel(score: BranchSurveyResponseScore): string {
    if (!score.isScored) {
      return this.i18n.translate('branchResponseDetails.unscored');
    }
    const percent = score.scorePercentage ?? 0;
    return `${this.i18n.translate('branchResponseDetails.scored')} - ${percent.toFixed(1)}%`;
  }

  questionTypeLabel(answer: BranchSurveyResponseAnswer): string {
    if (answer.questionTypeName) {
      return answer.questionTypeName;
    }
    switch (answer.questionType) {
      case 'SingleChoice':
        return this.i18n.translate('questions.typeSingleChoice');
      case 'StarRating':
        return this.i18n.translate('questions.typeStarRating');
      case 'Smiles':
        return this.i18n.translate('questions.typeSmiles');
      case 'Complain':
        return this.i18n.translate('questions.typeComplain');
      case 'Voice':
        return this.i18n.translate('questions.typeVoice');
      case 'Image':
        return this.i18n.translate('questions.typeImage');
      default:
        return answer.questionType;
    }
  }

  customInputTypeLabel(typeName: string): string {
    if (typeName.toLowerCase().includes('int') || typeName.toLowerCase().includes('num')) {
      return this.i18n.translate('surveyDashboard.typeInteger');
    }
    return this.i18n.translate('surveyDashboard.typeString');
  }

  displayAnswer(answer: BranchSurveyResponseAnswer): string {
    if (answer.questionType === 'SingleChoice') {
      return this.selectedOptionText(answer) || answer.displayValue || '-';
    }

    if (answer.questionType === 'StarRating') {
      return `${answer.starRatingValue ?? '-'} / 5`;
    }

    if (answer.questionType === 'Smiles') {
      return `${answer.smileValue ?? '-'} / 5`;
    }

    if (answer.questionType === 'Complain') {
      return answer.textAnswer || answer.displayValue || '-';
    }

    if (answer.questionType === 'Image') {
      return answer.imageFileName || answer.displayValue || this.i18n.translate('operatorTemplates.imageFileAnswer');
    }

    return answer.voiceFileName || answer.displayValue || this.i18n.translate('branchReports.voice');
  }

  isStarActive(slot: number, value: number | null): boolean {
    return slot <= (value ?? 0);
  }

  voiceUrl(answer: BranchSurveyResponseAnswer): string {
    return this.toMediaUrl(answer.voiceFileUrl);
  }

  imageUrl(answer: BranchSurveyResponseAnswer): string {
    return this.toMediaUrl(answer.imageFileUrl);
  }

  localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '-';
    }

    return englishText || arabicText || '-';
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
    answers: readonly BranchSurveyResponseAnswer[],
  ): readonly BranchResponseAnswerTreeNode[] {
    return answers.map((answer) => ({
      answer,
      children: this.toAnswerTree(answer.children),
    }));
  }
}
