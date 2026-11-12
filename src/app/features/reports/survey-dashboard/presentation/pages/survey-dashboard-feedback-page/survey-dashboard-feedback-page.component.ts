import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import {
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  Search,
  Layers,
  CheckCircle2,
  Inbox,
  LayoutList,
  Table,
  ArrowLeft,
  Eye,
  ChevronDown,
  Calendar,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { FlagActor, flagTypeKey } from '../../../../../../shared/models/response-flag.model';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { AuthStore } from '../../../../../auth/presentation/state/auth.store';
import { FeedbackPaginationComponent } from '../../../../../response-flags/presentation/feedback-pagination.component';
import { feedbackError } from '../../../../../response-flags/presentation/feedback-error';
import { DashboardDrillDownService } from '../../../../dashboard-drill-down/data/dashboard-drill-down.service';
import { SurveyDashboardService } from '../../../data/survey-dashboard.service';
import {
  SurveyDashboardBranchOption,
  SurveyDashboardComplaint,
  SurveyDashboardComplaintsPage,
  SurveyDashboardSource,
  SurveyDashboardTemplateOption,
} from '../../../domain/survey-dashboard.model';

@Component({
  selector: 'app-survey-dashboard-feedback-page',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    IconComponent,
    FeedbackPaginationComponent,
  ],
  templateUrl: './survey-dashboard-feedback-page.component.html',
  styleUrl: './survey-dashboard-feedback-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDashboardFeedbackPageComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly i18n = inject(I18nService);
  readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(SurveyDashboardService);
  private readonly drillDown = inject(DashboardDrillDownService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly mode = (this.route.snapshot.data['feedbackKind'] ?? 'complaints') as
    'complaints' | 'suggestions' | 'comments';
  readonly titleKey = `flags.${this.mode}`;
  get headerIcon() {
    if (this.mode === 'suggestions') return Lightbulb;
    if (this.mode === 'comments') return MessageSquare;
    return AlertTriangle;
  }
  get icon() {
    return this.headerIcon;
  }
  readonly searchIcon = Search;
  readonly resetIcon = RotateCcw;
  readonly layersIcon = Layers;
  readonly checkIcon = CheckCircle2;
  readonly alertIcon = AlertTriangle;
  readonly inboxIcon = Inbox;
  readonly backIcon = ArrowLeft;
  readonly streamIcon = LayoutList;
  readonly tableIcon = Table;
  readonly eyeIcon = Eye;
  readonly chevronDownIcon = ChevronDown;
  readonly calendarIcon = Calendar;
  readonly viewMode = signal<'stream' | 'table'>('stream');

  goBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      void this.router.navigateByUrl(returnUrl);
    } else {
      void this.router.navigate(['/reports/survey-dashboard']);
    }
  }
  readonly typeKey = flagTypeKey;
  readonly page = signal<SurveyDashboardComplaintsPage | null>(null);
  readonly branches = signal<readonly SurveyDashboardBranchOption[]>([]);
  readonly templates = signal<readonly SurveyDashboardTemplateOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly items = computed(() => this.page()?.page ?? []);
  readonly filters = this.fb.nonNullable.group({
    branchId: '',
    source: 'All',
    templateId: '',
    anonymousTemplateId: '',
    from: '',
    to: '',
    searchText: '',
    answered: '',
  });
  private request?: Subscription;
  private optionsRequest?: Subscription;
  private optionsKey = '';
  ngOnInit(): void {
    if (this.auth.userType() === 'SuperAdmin')
      this.service
        .getBranchOptions()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (items) => this.branches.set(items),
          error: (error) => this.error.set(feedbackError(error)),
        });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((routeParams) => {
      const path = routeParams.get('path');
      let params: { get(key: string): string | null } = routeParams;
      if (path) {
        try {
          params = new URL(path, 'http://dashboard.local').searchParams;
        } catch {
          this.error.set('flags.validationError');
          return;
        }
      }
      const source = params.get('source');
      const typedSource: SurveyDashboardSource =
        source === 'Anonymous' || source === 'Internal' ? source : 'All';
      const values = {
        branchId: params.get('branchId') ?? '',
        source: typedSource,
        templateId: params.get('templateId') ?? '',
        anonymousTemplateId: params.get('anonymousTemplateId') ?? '',
        from: (params.get('from') ?? '').slice(0, 10),
        to: (params.get('to') ?? '').slice(0, 10),
        searchText: params.get('searchText') ?? '',
        answered: params.get('answered') ?? '',
      };
      this.filters.setValue(values);
      this.loadOptions();
      const pageNumber = Math.max(1, Number(params.get('pageNumber')) || 1);
      const pageSize = Math.max(1, Math.min(100, Number(params.get('pageSize')) || 10));
      this.request?.unsubscribe();
      this.loading.set(true);
      this.error.set('');
      this.request = this.service
        .getFeedback(
          this.mode,
          {
            ...values,
            source: typedSource,
            pageNumber,
            pageSize,
            answered: values.answered === '' ? undefined : values.answered === 'true',
            flagId: params.get('flagId') ?? undefined,
          },
          path ?? undefined,
        )
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false)),
        )
        .subscribe({
          next: (page) => this.page.set(page),
          error: (error) => this.error.set(feedbackError(error)),
        });
    });
  }
  loadOptions(): void {
    const branchId = this.filters.controls.branchId.value;
    if (this.auth.userType() === 'SuperAdmin' && !branchId) {
      this.templates.set([]);
      return;
    }
    const key = branchId || 'current';
    if (this.optionsKey === key) return;
    this.optionsKey = key;
    this.optionsRequest?.unsubscribe();
    this.optionsRequest = this.service
      .getDashboardTemplateOptions({ branchId: branchId || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.templates.set(items),
        error: (error) => {
          this.optionsKey = '';
          this.error.set(feedbackError(error));
        },
      });
  }
  selectTemplate(value: string): void {
    const template = this.templates().find((item) => item.id === value);
    this.filters.patchValue({
      templateId: template?.dashboardSource === 'Anonymous' ? '' : value,
      anonymousTemplateId: template?.dashboardSource === 'Anonymous' ? value : '',
    });
  }
  apply(): void {
    this.navigate({ ...this.filters.getRawValue(), pageNumber: 1 });
  }
  clear(): void {
    this.navigate({
      branchId: '',
      source: 'All',
      templateId: '',
      anonymousTemplateId: '',
      from: '',
      to: '',
      searchText: '',
      answered: '',
      flagId: '',
      pageNumber: 1,
    });
  }
  changePage(pageNumber: number): void {
    this.navigate({ pageNumber });
  }
  changeSize(pageSize: number): void {
    this.navigate({ pageSize, pageNumber: 1 });
  }
  private navigate(updates: Record<string, string | number>): void {
    const path = this.route.snapshot.queryParamMap.get('path');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: path ? { path: this.drillDown.updatePath(path, updates) } : updates,
      queryParamsHandling: 'merge',
    });
  }
  openSurvey(item: SurveyDashboardComplaint): void {
    if (item.detailsNavigation)
      this.drillDown.open({
        title: this.i18n.translate('flags.viewSurvey'),
        navigation: item.detailsNavigation,
      });
  }
  localized(en: string | null | undefined, ar: string | null | undefined): string {
    return (this.i18n.language() === 'ar' ? ar || en : en || ar) || '—';
  }
  actor(value: FlagActor | null): string {
    return this.localized(value?.nameEn, value?.nameAr);
  }
}
