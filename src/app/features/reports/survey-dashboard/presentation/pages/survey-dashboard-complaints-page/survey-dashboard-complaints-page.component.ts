import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  MessageSquareWarning,
  RotateCcw,
  TrendingUp,
  User,
} from 'lucide-angular';
import { catchError, finalize, of, take } from 'rxjs';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { PageHeaderComponent } from '../../../../../../shared/ui/page-header/page-header.component';
import { AuthStore } from '../../../../../auth/presentation/state/auth.store';
import { DashboardDrillDownService } from '../../../../dashboard-drill-down/data/dashboard-drill-down.service';
import { SurveyDashboardService } from '../../../data/survey-dashboard.service';
import {
  SurveyDashboardComplaint,
  SurveyDashboardComplaintsPage,
  SurveyDashboardComplaintsQuery,
  SurveyDashboardSource,
  SurveyDashboardTemplateOption,
} from '../../../domain/survey-dashboard.model';

@Component({
  selector: 'app-survey-dashboard-complaints-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    IconComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './survey-dashboard-complaints-page.component.html',
  styleUrl: './survey-dashboard-complaints-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDashboardComplaintsPageComponent implements OnInit {
  private readonly service = inject(SurveyDashboardService);
  private readonly drillDown = inject(DashboardDrillDownService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly authStore = inject(AuthStore);

  readonly complaints = signal<SurveyDashboardComplaintsPage | null>(null);
  readonly templates = signal<readonly SurveyDashboardTemplateOption[]>([]);
  readonly source = signal<SurveyDashboardSource>('All');
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly complaintsIcon = MessageSquareWarning;
  readonly responsesIcon = FileText;
  readonly rateIcon = TrendingUp;
  readonly calendarIcon = Calendar;
  readonly questionIcon = HelpCircle;
  readonly userIcon = User;
  readonly eyeIcon = Eye;
  readonly filterIcon = Filter;
  readonly resetIcon = RotateCcw;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly alertCircleIcon = AlertCircle;
  readonly fileTextIcon = FileText;
  readonly layersIcon = Layers;

  readonly filtersForm = this.formBuilder.nonNullable.group({
    source: ['All' as SurveyDashboardSource],
    templateId: [''],
    from: [''],
    to: [''],
  });

  readonly filteredTemplates = computed(() => {
    const src = this.source();
    const list = this.templates();
    if (src === 'Internal') {
      return list.filter((item) => item.dashboardSource === 'Internal');
    }
    if (src === 'Anonymous') {
      return list.filter((item) => item.dashboardSource === 'Anonymous');
    }
    return list;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const initialSource = this.toSource(params.get('source'));
    this.source.set(initialSource);
    this.filtersForm.setValue({
      source: initialSource,
      templateId: params.get('templateId') ?? params.get('anonymousTemplateId') ?? '',
      from: this.datePart(params.get('from')),
      to: this.datePart(params.get('to')),
    });

    const branchId = params.get('branchId') ?? undefined;
    if (this.authStore.role() !== 'SUPER_ADMIN' || branchId) {
      this.service
        .getDashboardTemplateOptions({ branchId })
        .pipe(
          catchError(() => of([] as readonly SurveyDashboardTemplateOption[])),
          take(1),
        )
        .subscribe((templates) => this.templates.set(templates));
    }

    this.load(Number(params.get('pageNumber')) || 1);
  }

  onSourceChange(): void {
    const src = this.filtersForm.controls.source.value;
    this.source.set(src);
    const currentTemplateId = this.filtersForm.controls.templateId.value;
    if (currentTemplateId) {
      const match = this.filteredTemplates().some((item) => item.id === currentTemplateId);
      if (!match) {
        this.filtersForm.patchValue({ templateId: '' });
      }
    }
  }

  resetFilters(): void {
    this.filtersForm.reset({
      source: 'All',
      templateId: '',
      from: '',
      to: '',
    });
    this.source.set('All');
    this.applyFilters();
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    const template = this.templates().find((item) => item.id === value.templateId);
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          source: value.source,
          templateId: template?.dashboardSource === 'Internal' ? value.templateId || null : null,
          anonymousTemplateId:
            template?.dashboardSource === 'Anonymous' ? value.templateId || null : null,
          from: value.from ? `${value.from}T00:00:00` : null,
          to: value.to ? `${value.to}T23:59:59.999` : null,
          pageNumber: 1,
        },
        queryParamsHandling: 'merge',
      })
      .then(() => this.load(1));
  }

  backToDashboard(): void {
    void this.router.navigate(['/reports/survey-dashboard']);
  }

  load(pageNumber: number): void {
    const query = this.query(pageNumber);
    this.loading.set(true);
    this.error.set(false);
    this.service
      .getComplaints(query)
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => this.complaints.set(page),
        error: () => {
          this.complaints.set(null);
          this.error.set(true);
        },
      });
  }

  openResponse(complaint: SurveyDashboardComplaint): void {
    if (!complaint.detailsNavigation) return;
    this.drillDown.open({
      title: this.i18n.translate('dashboardDrillDown.responseDetails'),
      navigation: complaint.detailsNavigation,
      fallbackMetadata: {
        templateNameEn: complaint.templateNameEn,
        templateNameAr: complaint.templateNameAr,
        branchNameEn: complaint.branchNameEn,
        branchNameAr: complaint.branchNameAr,
        operatorNameEn: complaint.operatorNameEn,
        operatorNameAr: complaint.operatorNameAr,
      },
    });
  }

  templateName(item: { templateNameEn: string; templateNameAr: string | null }): string {
    return this.localized(item.templateNameEn, item.templateNameAr);
  }

  templateOptionName(template: SurveyDashboardTemplateOption): string {
    return template.displayName || this.localized(template.nameEn, template.nameAr);
  }

  questionText(item: SurveyDashboardComplaint): string {
    return this.localized(item.questionTextEn, item.questionTextAr);
  }

  operatorName(item: SurveyDashboardComplaint): string {
    return this.localized(item.operatorNameEn, item.operatorNameAr);
  }

  private query(pageNumber: number): SurveyDashboardComplaintsQuery {
    const params = this.route.snapshot.queryParamMap;
    return {
      branchId: params.get('branchId') ?? undefined,
      source: this.toSource(params.get('source')),
      templateId: params.get('templateId') ?? undefined,
      anonymousTemplateId: params.get('anonymousTemplateId') ?? undefined,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      pageNumber,
      pageSize: Number(params.get('pageSize')) || 20,
    };
  }

  private localized(english: string | null, arabic: string | null): string {
    return this.i18n.language() === 'ar' ? arabic || english || '-' : english || arabic || '-';
  }

  private toSource(value: string | null): SurveyDashboardSource {
    return value === 'Internal' || value === 'Anonymous' ? value : 'All';
  }

  private datePart(value: string | null): string {
    return value?.slice(0, 10) ?? '';
  }
}
