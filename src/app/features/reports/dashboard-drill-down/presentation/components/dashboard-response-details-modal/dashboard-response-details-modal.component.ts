import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  History,
  MessageSquareText,
  SlidersHorizontal,
  Smile,
  Star,
  User,
  X,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../../shared/ui/modal/modal.component';
import {
  DashboardResponseDetailItem,
  DashboardResponseDetails,
} from '../../../domain/dashboard-drill-down.model';

@Component({
  selector: 'app-dashboard-response-details-modal',
  standalone: true,
  imports: [DatePipe, IconComponent, ModalComponent, TranslatePipe],
  templateUrl: './dashboard-response-details-modal.component.html',
  styleUrl: './dashboard-response-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardResponseDetailsModalComponent {
  readonly i18n = inject(I18nService);

  readonly open = input<boolean>(false);
  readonly details = input<DashboardResponseDetails | null>(null);
  readonly loading = input<boolean>(false);
  readonly errorKey = input<string>('');
  readonly fallbackTemplateEn = input<string | null>(null);
  readonly fallbackTemplateAr = input<string | null>(null);
  readonly fallbackBranchEn = input<string | null>(null);
  readonly fallbackBranchAr = input<string | null>(null);
  readonly fallbackOperatorEn = input<string | null>(null);
  readonly fallbackOperatorAr = input<string | null>(null);

  readonly closed = output<void>();

  readonly alertIcon = AlertTriangle;
  readonly branchIcon = Building2;
  readonly calendarIcon = Calendar;
  readonly checkCircleIcon = CheckCircle2;
  readonly detailsIcon = Eye;
  readonly historyIcon = History;
  readonly messageIcon = MessageSquareText;
  readonly slidersIcon = SlidersHorizontal;
  readonly smileIcon = Smile;
  readonly starIcon = Star;
  readonly templateIcon = FileText;
  readonly userIcon = User;
  readonly closeIcon = X;

  readonly scaleSlots = [1, 2, 3, 4, 5];

  onClose(): void {
    this.closed.emit();
  }

  localized(english: string | null | undefined, arabic: string | null | undefined): string {
    const en = english?.trim() ?? '';
    const ar = arabic?.trim() ?? '';
    return this.i18n.language() === 'ar' ? ar || en || '—' : en || ar || '—';
  }

  templateDisplayName(details: DashboardResponseDetails): string {
    const val = this.localized(
      details.templateNameEn || this.fallbackTemplateEn(),
      details.templateNameAr || this.fallbackTemplateAr(),
    );
    return val !== '—' ? val : '—';
  }

  branchDisplayName(details: DashboardResponseDetails): string {
    const val = this.localized(
      details.branchNameEn || this.fallbackBranchEn(),
      details.branchNameAr || this.fallbackBranchAr(),
    );
    return val !== '—' ? val : '—';
  }

  operatorDisplayName(details: DashboardResponseDetails): string {
    const val = this.localized(
      details.operatorNameEn || this.fallbackOperatorEn(),
      details.operatorNameAr || this.fallbackOperatorAr(),
    );
    if (val !== '—') return val;
    return '—';
  }

  derivationLabel(derivation: string | undefined): string {
    if (derivation === 'SubmissionSnapshot') {
      return this.i18n.language() === 'ar' ? 'لقطة الإرسال' : 'Snapshot';
    }
    if (derivation === 'StoredRootBaseline') {
      return this.i18n.language() === 'ar' ? 'الأساس المخزن' : 'Baseline';
    }
    return derivation || '';
  }

  detailValue(item: DashboardResponseDetailItem): string {
    if (item.selectedOptionTextEn || item.selectedOptionTextAr) {
      return this.localized(item.selectedOptionTextEn, item.selectedOptionTextAr);
    }

    if (item.imageUrl) {
      return this.i18n.translate('dashboardDrillDown.imageAnswer');
    }

    if (item.voiceUrl) {
      return this.i18n.translate('branchReports.voice');
    }

    return item.value || item.type || '—';
  }

  answerBadgeClass(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes('صورة') || normalized.includes('image')) {
      return 'bg-cyan-50 text-cyan-800 border-cyan-200/70';
    }
    if (
      normalized.includes('excellent') ||
      normalized.includes('very good') ||
      normalized.includes('ممتاز') ||
      normalized.includes('جيد جدا')
    ) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/70';
    }
    if (
      normalized.includes('poor') ||
      normalized.includes('fair') ||
      normalized.includes('bad') ||
      normalized.includes('ضعيف') ||
      normalized.includes('غير راض') ||
      normalized.includes('غير راضي') ||
      normalized.includes('سيء') ||
      normalized.includes('سئ') ||
      normalized === 'no' ||
      normalized === 'لا'
    ) {
      return 'bg-rose-50 text-rose-700 border-rose-200/70';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200/80';
  }

  isStarActive(slot: number, value: number | null | undefined): boolean {
    return slot <= (value ?? 0);
  }

  isComplaintOrFreeText(item: DashboardResponseDetailItem): boolean {
    const qType = (item.questionType || item.type || '').toLowerCase();
    return qType.includes('complain') || qType.includes('freetext') || qType.includes('text');
  }

  customInputTypeLabel(typeName: string | null | undefined): string {
    if (!typeName) return '';
    const lower = typeName.toLowerCase();
    if (lower.includes('int') || lower.includes('num')) {
      return this.i18n.translate('surveyDashboard.typeInteger');
    }
    return this.i18n.translate('surveyDashboard.typeString');
  }

  questionTypeLabel(item: DashboardResponseDetailItem): string {
    const qType = item.questionType || item.type || '';
    switch (qType) {
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
        return item.type || qType;
    }
  }
}
