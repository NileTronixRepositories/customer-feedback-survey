import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  FileText,
  Filter,
  Folder,
  HelpCircle,
  Layers,
  LayoutGrid,
  ListFilter,
  MessageSquare,
  MessageSquareWarning,
  Quote,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table,
  TrendingUp,
  User,
  X,
} from 'lucide-angular';
import { catchError, finalize, of, take } from 'rxjs';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { PageHeaderComponent } from '../../../../../../shared/ui/page-header/page-header.component';
import { AuthStore } from '../../../../../auth/presentation/state/auth.store';
import { DashboardDrillDownService } from '../../../../dashboard-drill-down/data/dashboard-drill-down.service';
import { DashboardResponseDetails } from '../../../../dashboard-drill-down/domain/dashboard-drill-down.model';
import { DashboardResponseDetailsModalComponent } from '../../../../dashboard-drill-down/presentation/components/dashboard-response-details-modal/dashboard-response-details-modal.component';
import { SurveyDashboardService } from '../../../data/survey-dashboard.service';
import {
  SurveyDashboardComplaint,
  SurveyDashboardComplaintGroup,
  SurveyDashboardComplaintsPage,
  SurveyDashboardComplaintsQuery,
  SurveyDashboardSource,
  SurveyDashboardTemplateKind,
  SurveyDashboardTemplateOption,
} from '../../../domain/survey-dashboard.model';

@Component({
  selector: 'app-survey-dashboard-complaints-page',
  standalone: true,
  imports: [
    DashboardResponseDetailsModalComponent,
    DecimalPipe,
    FormsModule,
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
  readonly i18n = inject(I18nService);
  private readonly authStore = inject(AuthStore);

  readonly complaints = signal<SurveyDashboardComplaintsPage | null>(null);
  readonly templates = signal<readonly SurveyDashboardTemplateOption[]>([]);
  readonly source = signal<SurveyDashboardSource>('All');
  readonly loading = signal(false);
  readonly error = signal(false);

  // In-place response details modal
  readonly selectedDetails = signal<DashboardResponseDetails | null>(null);
  readonly detailsLoading = signal(false);
  readonly detailsErrorKey = signal('');
  readonly detailsModalOpen = signal(false);

  // Client-side quick filter & search signals
  readonly searchTerm = signal<string>('');
  readonly selectedTemplateFilter = signal<string>('ALL');
  readonly viewMode = signal<'table' | 'cards'>('table');
  readonly expandedRowIds = signal<Set<string>>(new Set());
  readonly pageSize = signal<number>(20);
  readonly pageSizeOptions = [10, 15, 20] as const;

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
  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;
  readonly alertCircleIcon = AlertCircle;
  readonly checkCircleIcon = CheckCircle2;
  readonly fileTextIcon = FileText;
  readonly layersIcon = Layers;
  readonly folderIcon = Folder;
  readonly quoteIcon = Quote;
  readonly sparklesIcon = Sparkles;
  readonly listFilterIcon = ListFilter;
  readonly searchIcon = Search;
  readonly clearIcon = X;
  readonly layoutGridIcon = LayoutGrid;
  readonly tableIcon = Table;
  readonly slidersIcon = SlidersHorizontal;
  readonly messageIcon = MessageSquare;

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

  // Flatten all complaints on current page with template kind metadata
  readonly allComplaints = computed<readonly SurveyDashboardComplaint[]>(() => {
    const page = this.complaints();
    if (!page) return [];

    const items: SurveyDashboardComplaint[] = [];
    for (const group of page.templateGroups) {
      for (const c of group.complaints) {
        items.push({
          ...c,
          templateNameEn: c.templateNameEn || group.templateNameEn,
          templateNameAr: c.templateNameAr || group.templateNameAr,
          templateKind: group.templateKind,
        });
      }
    }
    return items;
  });

  // Available template filter chips with counts
  readonly availableTemplateChips = computed(() => {
    const page = this.complaints();
    if (!page) return [];
    return page.templateGroups
      .filter((g) => g.complaintsCount > 0)
      .map((g) => ({
        id: g.templateId,
        name: this.templateName(g),
        count: g.complaintsCount,
        kind: g.templateKind,
      }));
  });

  // Filtered complaints based on template chip & search term
  readonly filteredComplaints = computed<readonly SurveyDashboardComplaint[]>(() => {
    let list = this.allComplaints();
    const filterId = this.selectedTemplateFilter();
    if (filterId !== 'ALL') {
      list = list.filter((c) => c.templateId === filterId);
    }

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter((c) => {
        const textMatch = (c.complaintText || '').toLowerCase().includes(term);
        const opMatch = (this.operatorName(c) || '').toLowerCase().includes(term);
        const tmplMatch = (this.templateName(c) || '').toLowerCase().includes(term);
        const qMatch = (this.questionText(c) || '').toLowerCase().includes(term);
        const idMatch = (c.responseId || '').toLowerCase().includes(term);
        return textMatch || opMatch || tmplMatch || qMatch || idMatch;
      });
    }
    return list;
  });

  readonly displayedComplaints = computed<readonly SurveyDashboardComplaint[]>(() => {
    const list = this.filteredComplaints();
    const p = this.complaints();
    if (!p) return list;

    if (list.length > p.pageSize) {
      const start = Math.max(0, (p.currentPage - 1) * p.pageSize);
      return list.slice(start, start + p.pageSize);
    }

    return list;
  });

  // Grouped template view for user preference
  readonly filteredTemplateGroups = computed(() => {
    const page = this.complaints();
    if (!page) return [];

    const filterId = this.selectedTemplateFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return page.templateGroups
      .filter((g) => g.complaintsCount > 0)
      .filter((g) => (filterId === 'ALL' ? true : g.templateId === filterId))
      .map((g) => {
        if (!term) return g;
        const matchingComplaints = g.complaints.filter((c) => {
          const textMatch = (c.complaintText || '').toLowerCase().includes(term);
          const opMatch = (this.operatorName(c) || '').toLowerCase().includes(term);
          const qMatch = (this.questionText(c) || '').toLowerCase().includes(term);
          const idMatch = (c.responseId || '').toLowerCase().includes(term);
          return textMatch || opMatch || qMatch || idMatch;
        });
        return {
          ...g,
          complaints: matchingComplaints,
        };
      })
      .filter((g) => g.complaints.length > 0);
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
    const initialPageSize = Number(params.get('pageSize')) || 20;
    this.pageSize.set([10, 15, 20].includes(initialPageSize) ? initialPageSize : 20);

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

  selectTemplateChip(id: string): void {
    this.selectedTemplateFilter.set(id);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode.set(mode);
  }

  toggleRowExpand(responseId: string): void {
    const next = new Set(this.expandedRowIds());
    if (next.has(responseId)) {
      next.delete(responseId);
    } else {
      next.add(responseId);
    }
    this.expandedRowIds.set(next);
  }

  isRowExpanded(responseId: string): boolean {
    return this.expandedRowIds().has(responseId);
  }

  resetFilters(): void {
    this.filtersForm.reset({
      source: 'All',
      templateId: '',
      from: '',
      to: '',
    });
    this.source.set('All');
    this.searchTerm.set('');
    this.selectedTemplateFilter.set('ALL');
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
          pageSize: this.pageSize(),
        },
        queryParamsHandling: 'merge',
      })
      .then(() => {
        this.selectedTemplateFilter.set('ALL');
        this.load(1);
      });
  }

  onPageSizeChange(newSize: number): void {
    const size = Number(newSize);
    if (!size || size === this.pageSize()) return;
    this.pageSize.set(size);
    const p = this.complaints();
    if (p && this.allComplaints().length > size) {
      const total = p.totalItems || this.allComplaints().length;
      this.complaints.set({
        ...p,
        pageSize: size,
        currentPage: 1,
        totalPages: Math.ceil(total / size) || 1,
      });
      return;
    }

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          pageSize: size,
          pageNumber: 1,
        },
        queryParamsHandling: 'merge',
      })
      .then(() => {
        this.load(1);
      });
  }

  goToPage(pageNumber: number): void {
    const p = this.complaints();
    if (!p) return;
    if (pageNumber < 1 || (p.totalPages && pageNumber > p.totalPages)) return;

    if (this.allComplaints().length > p.pageSize) {
      this.complaints.set({
        ...p,
        currentPage: pageNumber,
      });
      return;
    }

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          pageNumber,
          pageSize: this.pageSize(),
        },
        queryParamsHandling: 'merge',
      })
      .then(() => {
        this.load(pageNumber);
      });
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
        next: (page) => {
          this.complaints.set(page);
          this.selectedTemplateFilter.set('ALL');
        },
        error: () => {
          this.complaints.set(null);
          this.error.set(true);
        },
      });
  }

  openResponse(complaint: SurveyDashboardComplaint): void {
    if (!complaint.detailsNavigation) return;

    this.selectedDetails.set(null);
    this.detailsErrorKey.set('');
    this.detailsLoading.set(true);
    this.detailsModalOpen.set(true);

    this.drillDown
      .loadDetails(complaint.detailsNavigation)
      .pipe(
        take(1),
        finalize(() => this.detailsLoading.set(false)),
      )
      .subscribe({
        next: (details) => {
          const merged: DashboardResponseDetails = {
            ...details,
            templateNameEn: details.templateNameEn || complaint.templateNameEn || '',
            templateNameAr: details.templateNameAr || complaint.templateNameAr || null,
            branchNameEn: details.branchNameEn || complaint.branchNameEn || '',
            branchNameAr: details.branchNameAr || complaint.branchNameAr || null,
            operatorNameEn: details.operatorNameEn || complaint.operatorNameEn || null,
            operatorNameAr: details.operatorNameAr || complaint.operatorNameAr || null,
          };
          this.selectedDetails.set(merged);
        },
        error: (error: { status?: number }) => {
          this.detailsErrorKey.set(
            error.status === 403
              ? 'dashboardDrillDown.detailsForbidden'
              : 'dashboardDrillDown.detailsLoadError',
          );
        },
      });
  }

  closeDetailsModal(): void {
    this.detailsModalOpen.set(false);
    this.selectedDetails.set(null);
    this.detailsErrorKey.set('');
    this.detailsLoading.set(false);
  }

  formatDate(utcDate: string): string {
    if (!utcDate) return '-';
    const d = new Date(utcDate);
    if (isNaN(d.getTime())) return utcDate;
    const isAr = this.i18n.language() === 'ar';
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  complaintCountLabel(count: number): string {
    const isAr = this.i18n.language() === 'ar';
    if (!isAr) {
      return count === 1
        ? this.i18n.translate('surveyDashboard.complaintSingle')
        : this.i18n.translate('surveyDashboard.complaintsCountLabel');
    }
    if (count === 1) return this.i18n.translate('surveyDashboard.complaintSingle');
    if (count === 2) return this.i18n.translate('surveyDashboard.complaintsTwo');
    if (count >= 3 && count <= 10)
      return this.i18n.translate('surveyDashboard.complaintsCountLabel');
    return this.i18n.translate('surveyDashboard.complaintSingle');
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

  branchName(item: SurveyDashboardComplaint): string {
    return this.localized(item.branchNameEn, item.branchNameAr);
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
      pageSize: this.pageSize(),
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
