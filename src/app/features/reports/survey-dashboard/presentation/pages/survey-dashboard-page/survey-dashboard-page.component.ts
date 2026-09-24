import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  MessageSquareWarning,
  Mic,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  UserCog,
  UsersRound,
Hash,
  Mail,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { ThemeColorService } from '../../../../../../core/theme/theme-color.service';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { PageHeaderComponent } from '../../../../../../shared/ui/page-header/page-header.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import {
  BranchAdminBranchAdmin,
  BranchAdminBranchDetails,
  BranchAdminBranchUser,
  BranchAdminQuestion,
  BranchAdminQuestionGroup,
  BranchAdminTemplate,
} from '../../../../../branch-admin/branch/domain/branch-admin-branch.model';
import { BranchAdminBranchStore } from '../../../../../branch-admin/branch/presentation/state/branch-admin-branch.store';
import { AuthStore } from '../../../../../auth/presentation/state/auth.store';
import { SurveyTemplateDetailsModalComponent } from '../../components/survey-template-details-modal/survey-template-details-modal.component';
import { SurveyDashboardStore } from '../../state/survey-dashboard.store';
import { DashboardDrillDownService } from '../../../../dashboard-drill-down/data/dashboard-drill-down.service';
import { DashboardDetailsNavigation } from '../../../../dashboard-drill-down/domain/dashboard-drill-down.model';
import { SatisfactionDistributionComponent } from '../../../../dashboard-drill-down/presentation/components/satisfaction-distribution/satisfaction-distribution.component';
import { DashboardSummaryActionsComponent } from '../../../../dashboard-drill-down/presentation/components/dashboard-summary-actions/dashboard-summary-actions.component';
import {
  SurveyDashboardCriticalResponse,
  SurveyDashboardCustomInputPreview,
  SurveyDashboardCustomInputSegment,
  SurveyDashboardGroupBy,
  SurveyDashboardNavigation,
  SurveyDashboardQuery,
  SurveyDashboardSource,
  SurveyDashboardSourceMetrics,
  SurveyDashboardTemplateKind,
  SurveyDashboardTemplateOption,
  SurveyDashboardTemplatePerformance,
  SurveyDashboardTrendPoint,
} from '../../../domain/survey-dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-survey-dashboard-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    PageHeaderComponent,
    DecimalPipe,
    IconComponent,
    ReactiveFormsModule,
    SurveyTemplateDetailsModalComponent,
    SatisfactionDistributionComponent,
    DashboardSummaryActionsComponent,
    TranslatePipe,
  ],
  templateUrl: './survey-dashboard-page.component.html',
  styleUrl: './survey-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDashboardPageComponent implements OnInit, OnDestroy {
  readonly store = inject(SurveyDashboardStore);
  readonly branchStore = inject(BranchAdminBranchStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly themeColors = inject(ThemeColorService);
  private readonly drillDown = inject(DashboardDrillDownService);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendCanvas');
  private readonly templatePerformanceSection = viewChild<ElementRef<HTMLElement>>(
    'templatePerformanceSection',
  );
  readonly backIcon = ArrowLeft;

  private trendChart: Chart<'line', (number | null)[], string> | null = null;
  private templatePerformanceFocusTimer: ReturnType<typeof setTimeout> | null = null;

  readonly alertIcon = AlertTriangle;
  readonly branchIcon = Building2;
  readonly chartIcon = BarChart3;
  readonly chevronDownIcon = ChevronDown;
  readonly complaintIcon = MessageSquareWarning;
  readonly detailsIcon = Eye;
  readonly filterIcon = Filter;
  readonly helpIcon = HelpCircle;
  readonly layersIcon = Layers;
  readonly micIcon = Mic;
  readonly responsesIcon = UsersRound;
  readonly searchIcon = Search;
  readonly templateIcon = FileText;
  readonly trendIcon = TrendingUp;
  readonly questionsIcon = ClipboardList;
  readonly userCogIcon = UserCog;
  readonly slidersIcon = SlidersHorizontal;
  readonly resetIcon = RotateCcw;
  readonly calendarIcon = Calendar;
  readonly checkIcon = CheckCircle2;
  readonly hashIcon = Hash;
  readonly mailIcon = Mail;
  readonly mapPinIcon = MapPin;
  readonly shieldCheckIcon = ShieldCheck;
  readonly userIcon = User;
  readonly activeTableTab = signal<'templates' | 'questions' | 'critical' | 'branches' | 'all'>('templates');
  private lastSingleTab: 'templates' | 'questions' | 'critical' | 'branches' = 'templates';
  readonly collapsedSections = signal<ReadonlySet<string>>(new Set());
  readonly calculationOptionsOpen = signal(false);

  readonly advancedFiltersOpen = signal(true);
  readonly branchSnapshotExpanded = signal(false);
  readonly expandedBranchSections = signal<ReadonlySet<string>>(new Set());
  readonly templatePerformanceFocused = signal(false);
  readonly customInputSegmentsVisible = false;
  readonly validationError = signal<string | null>(null);
  readonly sourceSignal = signal<SurveyDashboardSource>('All');
  readonly selectedBranchId = signal('');
  readonly isSuperAdmin = computed(() => this.authStore.role() === 'SUPER_ADMIN');
  readonly branchSnapshotVisible = computed(
    () => this.authStore.isBranchAdminUserType() || this.authStore.role() === 'BRANCH_ADMIN',
  );
  readonly canOpenAuthorizedTemplatesDashboard = computed(() =>
    this.authStore.canAccessBranchDashboard(),
  );
  readonly canOpenAnonymousTemplatesDashboard = computed(
    () =>
      this.authStore.isBranchScopedActor() &&
      this.authStore.hasPermission('AnonymousTemplates.ViewResponses'),
  );

  readonly filtersForm = this.formBuilder.nonNullable.group({
    source: ['All' as SurveyDashboardSource],
    branchId: [''],
    templateId: [''],
    from: [''],
    to: [''],
    groupBy: ['Day' as SurveyDashboardGroupBy],
    scoreCalculationMode: ['RootQuestions' as const],
    topQuestionsCount: ['5'],
    criticalResponsesCount: ['10'],
    criticalScoreThreshold: ['40'],
  });

  readonly templateOptions = computed(() => this.filterTemplatesByBranch(this.store.templates()));
  readonly templatesSelectionDisabled = computed(
    () => this.isSuperAdmin() && this.selectedBranchId().length === 0,
  );

  constructor() {
    effect(() => {
      const canvas = this.chartCanvas();
      const dashboard = this.store.dashboard();
      const language = this.i18n.language();

      if (!canvas || !dashboard || dashboard.satisfactionTrend.length === 0) {
        this.trendChart?.destroy();
        this.trendChart = null;
        return;
      }

      this.renderTrendChart(canvas.nativeElement, dashboard.satisfactionTrend, language);
    });
  }

  ngOnInit(): void {
    if (this.branchSnapshotVisible()) {
      this.branchStore.load();
    }

    this.store.loadOptions();
    this.store.loadDashboard(this.queryFromForm());
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
    this.clearTemplatePerformanceFocusTimer();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  toggleBranchSnapshot(): void {
    this.branchSnapshotExpanded.update((expanded) => !expanded);
  }

  isBranchSectionExpanded(sectionKey: string): boolean {
    return this.expandedBranchSections().has(sectionKey);
  }

  toggleBranchSection(sectionKey: string): void {
    this.expandedBranchSections.update((sections) => {
      const nextSections = new Set(sections);
      if (nextSections.has(sectionKey)) {
        nextSections.delete(sectionKey);
      } else {
        nextSections.add(sectionKey);
      }

      return nextSections;
    });
  }

  onSourceChange(): void {
    const source = this.filtersForm.controls.source.value;
    this.sourceSignal.set(source);
    this.filtersForm.patchValue({
      templateId: '',
    });
  }

  onBranchChange(): void {
    const branchId = this.filtersForm.controls.branchId.value;
    this.selectedBranchId.set(branchId);
    this.filtersForm.patchValue({
      templateId: '',
    });
    this.store.loadTemplateOptions(branchId ? { branchId } : {});
  }

  applyFilters(): void {
    const validationError = this.validateFilters();
    this.validationError.set(validationError);
    if (validationError) {
      return;
    }

    this.store.loadDashboard(this.queryFromForm());
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      source: 'All',
      branchId: '',
      templateId: '',
      from: '',
      to: '',
      groupBy: 'Day',
      scoreCalculationMode: 'RootQuestions',
      topQuestionsCount: '5',
      criticalResponsesCount: '10',
      criticalScoreThreshold: '40',
    });
    this.sourceSignal.set('All');
    this.selectedBranchId.set('');
    this.validationError.set(null);
    this.store.loadTemplateOptions();
    this.store.loadDashboard(this.queryFromForm());
  }

  openAuthorizedTemplatesDashboard(): void {
    if (!this.canOpenAuthorizedTemplatesDashboard()) {
      return;
    }

    void this.router.navigate(['/branch-admin/templates/dashboard']);
  }

  openAnonymousTemplatesDashboard(): void {
    if (!this.canOpenAnonymousTemplatesDashboard()) {
      return;
    }

    void this.router.navigate(['/anonymous-templates/dashboard']);
  }

  setTableTab(tab: 'templates' | 'questions' | 'critical' | 'branches' | 'all'): void {
    if (tab === 'all') {
      this.toggleAllTables();
      return;
    }

    this.lastSingleTab = tab;
    this.activeTableTab.set(tab);
    this.collapsedSections.update((sections) => {
      const next = new Set(sections);
      next.delete(tab);
      return next;
    });
  }

  toggleAllTables(): void {
    if (this.activeTableTab() === 'all') {
      this.activeTableTab.set(this.lastSingleTab || 'templates');
    } else {
      this.activeTableTab.set('all');
      this.collapsedSections.set(new Set());
    }
  }

  isSectionActive(section: 'templates' | 'questions' | 'critical' | 'branches'): boolean {
    if (this.activeTableTab() === 'all') {
      return true;
    }
    return this.activeTableTab() === section;
  }

  isSectionCollapsed(sectionKey: string): boolean {
    return this.collapsedSections().has(sectionKey);
  }

  toggleTableSection(sectionKey: string): void {
    this.collapsedSections.update((sections) => {
      const next = new Set(sections);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  }

  toggleCalculationOptions(): void {
    this.calculationOptionsOpen.update((open) => !open);
  }

  focusTemplatePerformance(): void {
    this.activeTableTab.set('templates');
    const section = this.templatePerformanceSection()?.nativeElement;
    if (!section) {
      return;
    }

    this.clearTemplatePerformanceFocusTimer();
    this.templatePerformanceFocused.set(true);
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    section.focus({ preventScroll: true });
    this.templatePerformanceFocusTimer = setTimeout(() => {
      this.templatePerformanceFocused.set(false);
      this.templatePerformanceFocusTimer = null;
    }, 2000);
  }

  openNavigation(navigation: SurveyDashboardNavigation | null): void {
    if (navigation) {
      this.drillDown.open({
        title: this.i18n.translate('dashboardDrillDown.responsesTitle'),
        navigation,
      });
    }
  }

  openDrillDown(event: { title: string; navigation: DashboardDetailsNavigation }): void {
    this.drillDown.open(event);
  }

  openTemplateDetails(template: SurveyDashboardTemplatePerformance): void {
    this.store.loadTemplateDetails(template);
  }

  branchOptionName(branch: { nameEn: string; nameAr: string | null; code: string }): string {
    const name = this.localized(branch.nameEn, branch.nameAr);
    return branch.code ? `${name} (${branch.code})` : name;
  }

  templateOptionName(template: SurveyDashboardTemplateOption): string {
    const name = template.displayName || this.localized(template.nameEn, template.nameAr);
    const kind = this.templateKindLabel(template.templateKind);
    const label = `${name} - ${kind}`;
    if (!this.isSuperAdmin() || !template.branchNameEn) {
      return label;
    }

    const branchName = this.localized(template.branchNameEn, template.branchNameAr);
    const branchLabel = template.branchCode ? `${branchName} (${template.branchCode})` : branchName;
    return `${label} - ${branchLabel}`;
  }

  templateKindLabel(templateKind: SurveyDashboardTemplateKind): string {
    return templateKind === 'Anonymous'
      ? this.i18n.translate('surveyDashboard.templateKindAnonymous')
      : this.i18n.translate('surveyDashboard.templateKindAuthorized');
  }

  templateKindClass(templateKind: SurveyDashboardTemplateKind): string {
    return templateKind === 'Anonymous'
      ? 'bg-violet-50 text-violet-700'
      : 'bg-cyan-50 text-cyan-700';
  }

  assignedBranchName(branch: BranchAdminBranchDetails): string {
    return this.localized(branch.nameEn, branch.nameAr);
  }

  branchAdminName(admin: BranchAdminBranchAdmin): string {
    return this.localized(admin.nameEn, admin.nameAr);
  }

  branchUserName(user: BranchAdminBranchUser): string {
    return this.localized(user.nameEn, user.nameAr);
  }

  assignedTemplateName(template: BranchAdminTemplate): string {
    return this.localized(template.nameEn, template.nameAr);
  }

  assignedQuestionGroupName(group: BranchAdminQuestionGroup): string {
    return this.localized(group.nameEn, group.nameAr);
  }

  assignedQuestionText(question: BranchAdminQuestion): string {
    return this.localized(question.textEn, question.textAr);
  }

  branchUserRoles(user: BranchAdminBranchUser): string {
    return (
      user.roles
        .map((role) => role.name)
        .filter((role) => role.length > 0)
        .join(', ') || '-'
    );
  }

  branchUserRoleList(user: BranchAdminBranchUser): string[] {
    return user.roles.map((role) => role.name).filter((role) => role && role.length > 0);
  }

  userInitials(name: string | null | undefined): string {
    if (!name || !name.trim()) {
      return 'U';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  questionTypeLabel(type: string): string {
    const normalizedType = type.trim().toLowerCase();
    if (normalizedType === 'singlechoice') {
      return this.i18n.translate('questions.typeSingleChoice');
    }
    if (normalizedType === 'starrating') {
      return this.i18n.translate('questions.typeStarRating');
    }
    if (normalizedType === 'complain') {
      return this.i18n.translate('questions.typeComplain');
    }
    if (normalizedType === 'voice') {
      return this.i18n.translate('questions.typeVoice');
    }
    if (normalizedType === 'image') {
      return this.i18n.translate('questions.typeImage');
    }
    if (normalizedType === 'smiles') {
      return this.i18n.translate('questions.typeSmiles');
    }

    return type || '-';
  }

  localized(englishText: string | null | undefined, arabicText: string | null | undefined): string {
    const english = englishText?.trim() ?? '';
    const arabic = arabicText?.trim() ?? '';
    if (this.i18n.language() === 'ar') {
      return arabic || english || '-';
    }

    return english || arabic || '-';
  }

  sourceLabel(source: SurveyDashboardSource): string {
    if (source === 'Internal') {
      return this.i18n.translate('surveyDashboard.sourceInternal');
    }
    if (source === 'Anonymous') {
      return this.i18n.translate('surveyDashboard.sourceAnonymous');
    }

    return this.i18n.translate('surveyDashboard.sourceAll');
  }

  scoreLabel(value: number | null): string {
    return value === null ? this.i18n.translate('surveyDashboard.noData') : `${value.toFixed(1)}%`;
  }

  scoreClass(value: number | null): string {
    if (value === null) return 'bg-slate-100 text-slate-600';
    if (value >= 80) return 'bg-emerald-50 text-emerald-700';
    if (value >= 60) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  riskClass(riskLevel: string): string {
    if (riskLevel === 'HighRisk') return 'bg-rose-50 text-rose-700';
    if (riskLevel === 'MediumRisk') return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  riskLabel(riskLevel: string): string {
    if (riskLevel === 'HighRisk') {
      return this.i18n.translate('surveyDashboard.highRisk');
    }
    if (riskLevel === 'MediumRisk') {
      return this.i18n.translate('surveyDashboard.mediumRisk');
    }

    return this.i18n.translate('surveyDashboard.healthy');
  }

  sourceClass(source: SurveyDashboardSource): string {
    if (source === 'Internal') return 'bg-cyan-50 text-cyan-700';
    if (source === 'Anonymous') return 'bg-violet-50 text-violet-700';
    return 'bg-slate-100 text-slate-600';
  }

  breakdownAverage(metrics: SurveyDashboardSourceMetrics): string {
    return this.scoreLabel(metrics.averageScorePercentage);
  }

  customInputPreviewText(inputs: readonly SurveyDashboardCustomInputPreview[]): string {
    if (inputs.length === 0) {
      return this.i18n.translate('surveyDashboard.noCustomInputs');
    }

    return inputs
      .slice(0, 4)
      .map((input) => {
        const label = this.localized(input.labelEn || input.name, input.labelAr);
        return `${label}: ${input.value || '-'}`;
      })
      .join(' | ');
  }

  segmentLabel(segment: SurveyDashboardCustomInputSegment): string {
    return this.localized(segment.labelEn || segment.customInputName, segment.labelAr);
  }

  barWidth(value: number | null): string {
    if (value === null) {
      return '0%';
    }

    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  hasNavigation(navigation: SurveyDashboardNavigation | null): boolean {
    return (
      navigation !== null && navigation.method.toUpperCase() === 'GET' && navigation.path.length > 0
    );
  }

  private queryFromForm(): SurveyDashboardQuery {
    const value = this.filtersForm.getRawValue();
    const query: SurveyDashboardQuery = {
      branchId: this.isSuperAdmin() ? value.branchId || undefined : undefined,
      from: this.toStartOfDay(value.from),
      to: this.toEndOfDay(value.to),
      groupBy: value.groupBy,
      scoreCalculationMode: value.scoreCalculationMode,
      topQuestionsCount: this.toPositiveInteger(value.topQuestionsCount, 5),
      criticalResponsesCount: this.toPositiveInteger(value.criticalResponsesCount, 10),
      criticalScoreThreshold: this.toPercentage(value.criticalScoreThreshold, 40),
    };

    if (value.templateId) {
      query.templateId = value.templateId || undefined;
    } else {
      query.source = value.source;
    }

    return query;
  }

  private validateFilters(): string | null {
    const value = this.filtersForm.getRawValue();
    if (value.from && value.to && value.from > value.to) {
      return 'surveyDashboard.invalidDateRange';
    }

    const topQuestionsCount = this.toPositiveInteger(value.topQuestionsCount, 0);
    if (topQuestionsCount < 1) {
      return 'surveyDashboard.invalidTopQuestions';
    }

    const criticalResponsesCount = this.toPositiveInteger(value.criticalResponsesCount, 0);
    if (criticalResponsesCount < 1) {
      return 'surveyDashboard.invalidCriticalCount';
    }

    const threshold = Number(value.criticalScoreThreshold);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return 'surveyDashboard.invalidCriticalScore';
    }

    return null;
  }

  private filterTemplatesByBranch(
    templates: readonly SurveyDashboardTemplateOption[],
  ): readonly SurveyDashboardTemplateOption[] {
    const branchId = this.selectedBranchId();
    if (!this.isSuperAdmin() || branchId.length === 0) {
      return templates;
    }

    return templates.filter((template) => !template.branchId || template.branchId === branchId);
  }

  private clearTemplatePerformanceFocusTimer(): void {
    if (!this.templatePerformanceFocusTimer) {
      return;
    }

    clearTimeout(this.templatePerformanceFocusTimer);
    this.templatePerformanceFocusTimer = null;
  }

  private toPositiveInteger(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toPercentage(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : fallback;
  }

  private toStartOfDay(value: string): string | undefined {
    return value ? `${value}T00:00:00` : undefined;
  }

  private toEndOfDay(value: string): string | undefined {
    return value ? `${value}T23:59:59.999` : undefined;
  }

  public goBack(): void {
    window.history.back();
  }

  private renderTrendChart(
    canvas: HTMLCanvasElement,
    trend: readonly SurveyDashboardTrendPoint[],
    language: string,
  ): void {
    this.trendChart?.destroy();
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map((point) => point.period),
        datasets: [
          {
            label: this.i18n.translate('surveyDashboard.combined'),
            data: trend.map((point) => point.averageScorePercentage),
            borderColor: this.themeColors.color('accent'),
            backgroundColor: this.themeColors.rgba('accent', 0.1),
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: this.i18n.translate('surveyDashboard.sourceInternal'),
            data: trend.map((point) => point.internalAverageScorePercentage),
            borderColor: this.themeColors.color('success'),
            backgroundColor: this.themeColors.rgba('success', 0.08),
            fill: false,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: this.i18n.translate('surveyDashboard.sourceAnonymous'),
            data: trend.map((point) => point.anonymousAverageScorePercentage),
            borderColor: this.themeColors.color('secondary'),
            backgroundColor: this.themeColors.rgba('secondary', 0.08),
            fill: false,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        locale: language,
        spanGaps: false,
        onClick: (_event, elements) => {
          const point = trend[elements[0]?.index ?? -1];
          if (point?.detailsNavigation) {
            this.openNavigation(point.detailsNavigation);
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: { boxWidth: 10, boxHeight: 10 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value === null ? this.i18n.translate('surveyDashboard.noData') : `${value.toFixed(1)}%`}`;
              },
              afterBody: (items) => {
                const point = trend[items[0]?.dataIndex ?? 0];
                return point
                  ? `${this.i18n.translate('surveyDashboard.responses')}: ${point.responsesCount}`
                  : '';
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            grace: '5%',
            grid: { color: this.themeColors.color('gridLine') },
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true },
          },
        },
      },
    });
  }
}
