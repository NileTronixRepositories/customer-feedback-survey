import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Inbox,
  Layers,
  MessageSquare,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../../../../core/services/i18n.service';
import { resolveMediaUrl } from '../../../../../shared/utils/media-url.util';
import { AnonymousTemplatesStore } from '../../state/anonymous-templates.store';

@Component({
  selector: 'app-anonymous-template-responses-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './anonymous-template-responses-page.component.html',
  styleUrl: './anonymous-template-responses-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateResponsesPageComponent implements OnInit {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly awardIcon = Award;
  readonly barChartIcon = BarChart3;
  readonly calendarIcon = Calendar;
  readonly checkCircleIcon = CheckCircle2;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly clockIcon = Clock;
  readonly detailsIcon = Eye;
  readonly fileTextIcon = FileText;
  readonly filterIcon = Filter;
  readonly inboxIcon = Inbox;
  readonly layersIcon = Layers;
  readonly messageSquareIcon = MessageSquare;
  readonly rotateCcwIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly sparklesIcon = Sparkles;
  readonly trendingUpIcon = TrendingUp;

  readonly anonymousTemplateId = this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '';
  readonly canViewResponses = computed(() =>
    this.authStore.canManageAnonymousTemplates('ViewResponses'),
  );

  readonly selectedTemplate = computed(() => this.anonymousTemplatesStore.selectedTemplate());

  readonly templateLogoUrl = computed(() => {
    const template = this.selectedTemplate();
    return template?.logoPath ? resolveMediaUrl(template.logoPath) : null;
  });

  readonly totalResponses = computed(() => this.anonymousTemplatesStore.responsesTotalItems());

  readonly scoredResponsesCount = computed(() =>
    this.anonymousTemplatesStore.responses().filter((r) => r.isScored).length,
  );

  readonly averageScorePercentage = computed(() => {
    const scored = this.anonymousTemplatesStore.responses().filter(
      (r) => r.isScored && r.scorePercentage !== null,
    );
    if (scored.length === 0) {
      return null;
    }
    const sum = scored.reduce((acc, curr) => acc + (curr.scorePercentage ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  });

  readonly totalAnswersInPage = computed(() =>
    this.anonymousTemplatesStore.responses().reduce((acc, curr) => acc + curr.answersCount, 0),
  );

  readonly filtersForm = this.formBuilder.nonNullable.group({
    fromDate: [''],
    toDate: [''],
    minScorePercentage: [''],
    maxScorePercentage: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  ngOnInit(): void {
    if (this.anonymousTemplateId.length === 0 || !this.canViewResponses()) {
      return;
    }

    this.anonymousTemplatesStore.loadDetails(this.anonymousTemplateId);
    this.anonymousTemplatesStore.loadResponses(this.anonymousTemplateId);
  }

  goBack(): void {
    this.location.back();
  }

  applyFilters(): void {
    if (this.anonymousTemplateId.length === 0 || !this.canViewResponses()) {
      return;
    }

    const value = this.filtersForm.getRawValue();
    this.anonymousTemplatesStore.searchResponses(
      this.anonymousTemplateId,
      this.toPageSize(value.pageSize),
      value.orderSort,
      this.toStartOfDayUtc(value.fromDate),
      this.toEndOfDayUtc(value.toDate),
      this.toScoreFilter(value.minScorePercentage),
      this.toScoreFilter(value.maxScorePercentage),
    );
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      fromDate: '',
      toDate: '',
      minScorePercentage: '',
      maxScorePercentage: '',
      pageSize: '10',
      orderSort: '',
    });

    if (this.anonymousTemplateId.length > 0 && this.canViewResponses()) {
      this.anonymousTemplatesStore.searchResponses(
        this.anonymousTemplateId,
        10,
        '',
        null,
        null,
        null,
        null,
      );
    }
  }

  previousPage(): void {
    this.anonymousTemplatesStore.previousResponsesPage(this.anonymousTemplateId);
  }

  nextPage(): void {
    this.anonymousTemplatesStore.nextResponsesPage(this.anonymousTemplateId);
  }

  selectedTemplateDisplayName(): string {
    const template = this.anonymousTemplatesStore.selectedTemplate();
    if (!template) {
      return this.i18n.translate('anonymousTemplates.responsesTitle');
    }

    return this.localizedText(template.nameEn, template.nameAr);
  }

  private localizedText(
    enValue: string | null | undefined,
    arValue: string | null | undefined,
    fallback = '-',
  ): string {
    const englishText = enValue?.trim() ?? '';
    const arabicText = arValue?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || fallback;
    }

    return englishText || arabicText || fallback;
  }

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize)) {
      return 10;
    }

    return Math.min(Math.max(pageSize, 1), 100);
  }

  private toScoreFilter(value: string): number | null {
    if (value.trim().length === 0) {
      return null;
    }

    const score = Number(value);
    return Number.isFinite(score) ? Math.min(Math.max(score, 0), 100) : null;
  }

  private toStartOfDayUtc(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private toEndOfDayUtc(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
}
