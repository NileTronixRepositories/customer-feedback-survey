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
import { RouterLink } from '@angular/router';
import {
  Search,
  SlidersHorizontal,
  Building2,
  Users,
  FileText,
  BarChart3,
  AlertTriangle,
  Mic,
  TrendingUp,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { PageHeaderComponent } from '../../../../../../shared/ui/page-header/page-header.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { ScoreModeSelectorComponent } from '../../../../../../shared/ui/score-mode-selector/score-mode-selector.component';
import { HistoricalAvailabilityCardComponent } from '../../../../../../shared/ui/historical-availability-card/historical-availability-card.component';
import { HistoricalWarningBannerComponent } from '../../../../../../shared/ui/historical-warning-banner/historical-warning-banner.component';
import { ScoreCalculationMode } from '../../../../../../shared/models/score-calculation-mode.model';
import {
  ReportBranchOption,
  ReportDepartmentOption,
  SystemBranchPerformance,
  SystemCriticalResponse,
  SystemDashboardResponse,
  SystemReportsGroupBy,
  SystemReportsRiskLevel,
  SystemTemplatePerformance,
} from '../../../domain/system-reports.model';
import { SystemReportsStore } from '../../state/system-reports.store';
import { DashboardDrillDownService } from '../../../../../reports/dashboard-drill-down/data/dashboard-drill-down.service';
import { DashboardDetailsNavigation } from '../../../../../reports/dashboard-drill-down/domain/dashboard-drill-down.model';
import { SatisfactionDistributionComponent } from '../../../../../reports/dashboard-drill-down/presentation/components/satisfaction-distribution/satisfaction-distribution.component';
import { DashboardSummaryActionsComponent } from '../../../../../reports/dashboard-drill-down/presentation/components/dashboard-summary-actions/dashboard-summary-actions.component';

@Component({
  selector: 'app-system-dashboard-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    PageHeaderComponent,
    DecimalPipe,
    IconComponent,
    ReactiveFormsModule,
    RouterLink,
    SatisfactionDistributionComponent,
    DashboardSummaryActionsComponent,
    TranslatePipe,
    ScoreModeSelectorComponent,
    HistoricalAvailabilityCardComponent,
    HistoricalWarningBannerComponent,
  ],
  templateUrl: './system-dashboard-page.component.html',
  styleUrl: './system-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemDashboardPageComponent implements OnInit {
  readonly store = inject(SystemReportsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly drillDown = inject(DashboardDrillDownService);

  readonly searchIcon = Search;
  readonly filtersIcon = SlidersHorizontal;
  readonly buildingIcon = Building2;
  readonly usersIcon = Users;
  readonly fileTextIcon = FileText;
  readonly barChartIcon = BarChart3;
  readonly alertTriangleIcon = AlertTriangle;
  readonly micIcon = Mic;
  readonly trendingUpIcon = TrendingUp;

  readonly advancedFiltersOpen = signal(true);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    branchId: [''],
    departmentId: [''],
    groupBy: ['Day' as SystemReportsGroupBy],
    scoreCalculationMode: ['RootQuestions' as ScoreCalculationMode],
  });

  readonly branchMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalBranches,
      active: summary.activeBranches,
      inactive: summary.inactiveBranches,
      activePercentage:
        summary.totalBranches > 0
          ? Math.round((summary.activeBranches / summary.totalBranches) * 100)
          : 0,
    };
  });

  readonly orgMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      departments: summary.totalDepartments,
      activeDepartments: summary.activeDepartments,
      operators: summary.totalOperators,
    };
  });

  readonly templateMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalTemplates,
      active: summary.activeTemplates,
      activePercentage:
        summary.totalTemplates > 0
          ? Math.round((summary.activeTemplates / summary.totalTemplates) * 100)
          : 0,
    };
  });

  readonly responseMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    const hasScoreData = summary.hasScoreData ?? summary.totalResponses > 0;
    return {
      total: summary.totalResponses,
      averageScore:
        summary.satisfactionPercentage !== undefined
          ? summary.satisfactionPercentage
          : hasScoreData !== false
            ? summary.averageScorePercentage
            : null,
      hasScoreData,
      complaints: summary.complaintsCount,
      voice: summary.voiceAnswersCount,
    };
  });

  ngOnInit(): void {
    this.store.loadOptions();
    this.store.loadDashboard();
  }

  onScoreModeChange(mode: ScoreCalculationMode): void {
    this.filtersForm.controls.scoreCalculationMode.setValue(mode);
    this.applyFilters();
  }

  scoreLabel(value: number | null | undefined, hasScoreData: boolean = true): string {
    if (!hasScoreData || value === null || value === undefined) {
      return 'N/A';
    }
    return `${value.toFixed(1)}%`;
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.store.loadDashboard({
      from: value.from || undefined,
      to: value.to || undefined,
      branchId: value.branchId || undefined,
      departmentId: value.departmentId || undefined,
      groupBy: value.groupBy,
      scoreCalculationMode: value.scoreCalculationMode,
      criticalScoreThreshold: 40,
      criticalResponsesCount: 10,
      topTemplatesCount: 10,
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      branchId: '',
      departmentId: '',
      groupBy: 'Day',
      scoreCalculationMode: 'RootQuestions',
    });
    this.store.loadDashboard();
  }

  openDetails(response: SystemCriticalResponse): void {
    this.openNavigation(
      response.detailsNavigation,
      this.i18n.translate('dashboardDrillDown.responseDetails'),
    );
  }

  openDrillDown(event: { title: string; navigation: DashboardDetailsNavigation }): void {
    this.drillDown.open(event);
  }

  openNavigation(navigation: DashboardDetailsNavigation | null, title: string): void {
    if (navigation) this.drillDown.open({ title, navigation });
  }

  localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }

  branchOptionName(branch: ReportBranchOption): string {
    const name = this.localized(branch.nameEn, branch.nameAr);
    return branch.code ? `${name} (${branch.code})` : name;
  }

  departmentOptionName(department: ReportDepartmentOption): string {
    return this.localized(department.nameEn, department.nameAr);
  }

  branchName(
    item: SystemBranchPerformance | SystemCriticalResponse | SystemTemplatePerformance,
  ): string {
    return this.localized(item.branchNameEn, item.branchNameAr);
  }

  riskLabel(riskLevel: SystemReportsRiskLevel): string {
    if (riskLevel === 'HighRisk') return this.i18n.translate('systemDashboard.highRisk');
    if (riskLevel === 'MediumRisk') return this.i18n.translate('systemDashboard.mediumRisk');
    return this.i18n.translate('systemDashboard.healthy');
  }
}
