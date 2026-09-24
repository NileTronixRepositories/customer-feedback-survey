import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MessageSquareWarning,
  Mic,
  Search,
  SlidersHorizontal,
  User,
  UsersRound,
  X,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../../shared/ui/modal/modal.component';
import { PageHeaderComponent } from '../../../../../../shared/ui/page-header/page-header.component';
import { DashboardDrillDownService } from '../../../data/dashboard-drill-down.service';
import {
  DashboardDetailsNavigation,
  DashboardResponseDetailItem,
  DashboardResponseDetails,
  DashboardResponseListItem,
  DashboardResponsesPage,
} from '../../../domain/dashboard-drill-down.model';

@Component({
  selector: 'app-dashboard-responses-page',
  imports: [
    ButtonComponent,
    DatePipe,
    IconComponent,
    ModalComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './dashboard-responses-page.component.html',
  styleUrl: './dashboard-responses-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardResponsesPageComponent {
  readonly alertIcon = AlertTriangle;
  readonly branchIcon = Building2;
  readonly calendarIcon = Calendar;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly closeIcon = X;
  readonly complaintIcon = MessageSquareWarning;
  readonly detailsIcon = Eye;
  readonly micIcon = Mic;
  readonly responsesIcon = UsersRound;
  readonly searchIcon = Search;
  readonly slidersIcon = SlidersHorizontal;
  readonly templateIcon = FileText;
  readonly userIcon = User;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly drillDown = inject(DashboardDrillDownService);
  private readonly i18n = inject(I18nService);

  readonly title = signal('');
  readonly originalPath = signal('');
  readonly currentPath = signal('');
  readonly routeType = signal('');
  readonly page = signal<DashboardResponsesPage | null>(null);
  readonly loading = signal(true);
  readonly errorKey = signal('');
  readonly selectedDetails = signal<DashboardResponseDetails | null>(null);
  readonly detailsLoading = signal(false);
  readonly detailsErrorKey = signal('');
  readonly directDetails = computed(() => this.routeType().toLowerCase().includes('details'));

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly sortControl = new FormControl<'Newest' | 'Oldest'>('Newest', { nonNullable: true });
  readonly pageSizeControl = new FormControl(10, { nonNullable: true });

  readonly resultSummary = computed(() => {
    const page = this.page();
    if (!page) return '';
    return this.i18n.translate('dashboardDrillDown.resultSummary')
      .replace('{count}', String(page.totalItems))
      .replace('{page}', String(page.currentPage))
      .replace('{pages}', String(Math.max(page.totalPages, 1)));
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const path = params.get('path') ?? '';
      this.title.set(params.get('title') || this.i18n.translate('dashboardDrillDown.responsesTitle'));
      this.routeType.set(params.get('routeType') ?? '');
      this.originalPath.set(path);
      this.currentPath.set(path);
      this.syncControls(path);
      if (this.directDetails()) {
        this.loading.set(false);
        this.loadDirectDetails(path);
      } else {
        this.load(path);
      }
    });
  }

  applySearch(): void {
    this.loadWithUpdates({ pageNumber: 1, searchText: this.searchControl.value.trim() });
  }

  changeSort(): void {
    this.loadWithUpdates({ pageNumber: 1, orderSort: this.sortControl.value });
  }

  changePageSize(): void {
    this.loadWithUpdates({ pageNumber: 1, pageSize: this.pageSizeControl.value });
  }

  previousPage(): void {
    const page = this.page();
    if (page?.hasPreviousPage) this.loadWithUpdates({ pageNumber: page.currentPage - 1 });
  }

  nextPage(): void {
    const page = this.page();
    if (page?.hasNextPage) this.loadWithUpdates({ pageNumber: page.currentPage + 1 });
  }

  retry(): void {
    this.load(this.currentPath());
  }

  openDetails(item: DashboardResponseListItem): void {
    const navigation = item.detailsNavigation ?? this.detailsNavigationFor(item);
    if (!navigation) return;

    this.selectedDetails.set(null);
    this.detailsErrorKey.set('');
    this.detailsLoading.set(true);
    this.drillDown
      .loadDetails(navigation)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.detailsLoading.set(false)),
      )
      .subscribe({
        next: (details) => this.selectedDetails.set(details),
        error: (error: { status?: number }) =>
          this.detailsErrorKey.set(
            error.status === 403
              ? 'dashboardDrillDown.detailsForbidden'
              : 'dashboardDrillDown.detailsLoadError',
          ),
      });
  }

  closeDetails(): void {
    if (this.directDetails()) {
      this.goBack();
      return;
    }
    this.selectedDetails.set(null);
    this.detailsErrorKey.set('');
  }

  localized(english: string | null | undefined, arabic: string | null | undefined): string {
    const en = english?.trim() ?? '';
    const ar = arabic?.trim() ?? '';
    return this.i18n.language() === 'ar' ? ar || en || '—' : en || ar || '—';
  }

  score(item: DashboardResponseListItem): string {
    return item.isScored && item.scorePercentage !== null
      ? `${item.scorePercentage.toFixed(1)}%`
      : this.i18n.translate('dashboardDrillDown.notScored');
  }

  scoreClass(value: number | null): string {
    if (value === null) return 'score-badge score-badge--empty';
    if (value >= 80) return 'score-badge score-badge--positive';
    if (value >= 60) return 'score-badge score-badge--neutral';
    return 'score-badge score-badge--negative';
  }

  preview(item: DashboardResponseListItem): string {
    if (item.customInputsPreview.length === 0) return '—';
    return item.customInputsPreview
      .slice(0, 3)
      .map((input) => `${this.localized(input.labelEn || input.name, input.labelAr)}: ${input.value || '—'}`)
      .join(' · ');
  }

  detailValue(item: DashboardResponseDetailItem): string {
    return item.value || item.type || '—';
  }

  goBack(): void {
    window.history.back();
  }

  private loadWithUpdates(
    updates: Readonly<Partial<Record<'pageNumber' | 'pageSize' | 'searchText' | 'orderSort', string | number>>>,
  ): void {
    const path = this.drillDown.updatePath(this.currentPath() || this.originalPath(), updates);
    this.currentPath.set(path);
    this.load(path);
  }

  private loadDirectDetails(path: string): void {
    const navigation: DashboardDetailsNavigation = {
      routeType: this.routeType(),
      method: 'GET',
      path,
    };
    if (!this.drillDown.isSupported(navigation)) {
      this.detailsErrorKey.set('dashboardDrillDown.invalidNavigation');
      return;
    }

    this.detailsLoading.set(true);
    this.drillDown
      .loadDetails(navigation)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.detailsLoading.set(false)),
      )
      .subscribe({
        next: (details) => this.selectedDetails.set(details),
        error: (error: { status?: number }) =>
          this.detailsErrorKey.set(
            error.status === 403
              ? 'dashboardDrillDown.detailsForbidden'
              : 'dashboardDrillDown.detailsLoadError',
          ),
      });
  }

  private load(path: string): void {
    const navigation: DashboardDetailsNavigation = {
      routeType: this.routeType(),
      method: 'GET',
      path,
    };
    if (!this.drillDown.isSupported(navigation)) {
      this.loading.set(false);
      this.errorKey.set('dashboardDrillDown.invalidNavigation');
      return;
    }

    this.errorKey.set('');
    this.loading.set(true);
    this.drillDown
      .loadResponses(path)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => this.page.set(page),
        error: (error: { status?: number }) => {
          this.page.set(null);
          this.errorKey.set(
            error.status === 403 ? 'dashboardDrillDown.forbidden' : 'dashboardDrillDown.loadError',
          );
        },
      });
  }

  private syncControls(path: string): void {
    try {
      const url = new URL(path, 'http://dashboard.local');
      this.searchControl.setValue(url.searchParams.get('searchText') ?? '', { emitEvent: false });
      this.sortControl.setValue(
        url.searchParams.get('orderSort') === 'Oldest' ? 'Oldest' : 'Newest',
        { emitEvent: false },
      );
      const pageSize = Number(url.searchParams.get('pageSize'));
      this.pageSizeControl.setValue([10, 25, 50, 100].includes(pageSize) ? pageSize : 10, {
        emitEvent: false,
      });
    } catch {
      // Invalid navigation is surfaced by load().
    }
  }

  private detailsNavigationFor(item: DashboardResponseListItem): DashboardDetailsNavigation | null {
    if (!item.responseId) return null;
    const path = this.currentPath();
    let detailsPath = '';

    if (path.startsWith('/api/reports/department-responses') && item.operatorId) {
      detailsPath = `/api/reports/department-operators/${encodeURIComponent(item.operatorId)}/responses/${encodeURIComponent(item.responseId)}`;
    } else if (path.startsWith('/api/reports/department-operators/')) {
      detailsPath = `${path.split('?')[0].replace(/\/$/, '')}/${encodeURIComponent(item.responseId)}`;
    } else if (path.startsWith('/api/reports/branch-responses')) {
      detailsPath = `/api/reports/branch-responses/${encodeURIComponent(item.responseId)}`;
    } else if (path.startsWith('/api/reports/system-responses')) {
      detailsPath = `/api/reports/system-responses/${encodeURIComponent(item.responseId)}`;
    } else if (item.templateId && path.includes('anonymous')) {
      detailsPath = `/api/anonymous-templates/${encodeURIComponent(item.templateId)}/responses/${encodeURIComponent(item.responseId)}`;
    }

    return detailsPath
      ? { routeType: 'ResponseDetails', method: 'GET', path: detailsPath }
      : null;
  }
}
