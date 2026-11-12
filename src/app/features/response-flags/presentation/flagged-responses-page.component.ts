import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { Flag } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FLAG_TYPES, flagType, flagTypeKey } from '../../../shared/models/response-flag.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { ResponseFlagsService } from '../data/response-flags.service';
import { FeedbackPage, FlaggedResponseSummary } from '../domain/response-flags.model';
import { FeedbackPaginationComponent } from './feedback-pagination.component';
import { feedbackError } from './feedback-error';

@Component({
  selector: 'app-flagged-responses-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonComponent,
    PageHeaderComponent,
    FeedbackPaginationComponent,
  ],
  templateUrl: './flagged-responses-page.component.html',
  styleUrl: './feedback.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlaggedResponsesPageComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ResponseFlagsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);
  readonly icon = Flag;
  readonly types = FLAG_TYPES;
  readonly typeKey = flagTypeKey;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly page = signal<FeedbackPage<FlaggedResponseSummary> | null>(null);
  readonly hasFilters = signal(false);
  readonly filters = this.fb.nonNullable.group({
    searchText: '',
    type: '',
    answered: '',
    from: '',
    to: '',
    orderSort: 'Newest',
  });
  private request?: Subscription;
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const value = {
        searchText: params.get('searchText') ?? '',
        type: params.get('type') ?? '',
        answered: params.get('answered') ?? '',
        from: params.get('from') ?? '',
        to: params.get('to') ?? '',
        orderSort: params.get('orderSort') ?? 'Newest',
      };
      this.filters.setValue(value);
      this.hasFilters.set(
        !!(value.searchText || value.type || value.answered || value.from || value.to),
      );
      this.request?.unsubscribe();
      this.loading.set(true);
      this.error.set('');
      const pageNumber = Math.max(1, Number(params.get('pageNumber')) || 1);
      const pageSize = [10, 25, 50].includes(Number(params.get('pageSize')))
        ? Number(params.get('pageSize'))
        : 10;
      this.request = this.api
        .list({
          ...value,
          pageNumber,
          pageSize,
          type: flagType(value.type) ?? undefined,
          answered: value.answered === '' ? undefined : value.answered === 'true',
        })
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
  apply(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...this.filters.getRawValue(),
        pageNumber: 1,
        pageSize: this.page()?.pageSize ?? 10,
      },
    });
  }
  clear(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
  changePage(pageNumber: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageNumber },
      queryParamsHandling: 'merge',
    });
  }
  changeSize(pageSize: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageSize, pageNumber: 1 },
      queryParamsHandling: 'merge',
    });
  }
  localized(en: string, ar: string | null): string {
    return (this.i18n.language() === 'ar' ? ar || en : en || ar) || '—';
  }
}
