import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import {
  DashboardDetailsNavigation,
  DashboardSummaryActions,
} from '../../reports/dashboard-drill-down/domain/dashboard-drill-down.model';
import { DashboardDrillDownService } from '../../reports/dashboard-drill-down/data/dashboard-drill-down.service';

@Component({
  selector: 'app-dashboard-feedback-counts',
  imports: [TranslatePipe],
  template: `<dl class="flex flex-wrap items-center gap-2">
    @for (metric of metrics; track metric) {
      <div
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-1 text-xs text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:border-slate-300"
      >
        <dt class="font-bold text-slate-500">{{ 'flags.' + metric | t }}</dt>
        <dd>
          @if (actions()?.[metric]; as navigation) {
            <button
              type="button"
              class="inline-flex min-w-5 h-5 items-center justify-center rounded-md bg-[var(--theme-color-secondary)]/10 px-1.5 text-xs font-black text-[var(--theme-color-secondary)] transition hover:bg-[var(--theme-color-secondary)]/20 focus:outline-none cursor-pointer"
              (click)="open(metric, navigation)"
            >
              {{
                (metric === 'suggestions' ? counts().suggestionsCount : counts().commentsCount) ?? 0
              }}
            </button>
          } @else {
            <span
              class="inline-flex min-w-5 h-5 items-center justify-center rounded-md bg-slate-200/60 px-1.5 text-xs font-black text-slate-700"
            >
              {{
                (metric === 'suggestions' ? counts().suggestionsCount : counts().commentsCount) ?? 0
              }}
            </span>
          }
        </dd>
      </div>
    }
  </dl>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFeedbackCountsComponent {
  readonly counts = input.required<{ suggestionsCount?: number; commentsCount?: number }>();
  readonly actions = input<Pick<DashboardSummaryActions, 'suggestions' | 'comments'> | null>(null);
  readonly compact = input(false);
  readonly metrics = ['suggestions', 'comments'] as const;
  private readonly drillDown = inject(DashboardDrillDownService);
  private readonly i18n = inject(I18nService);
  open(metric: string, navigation: DashboardDetailsNavigation): void {
    this.drillDown.open({ title: this.i18n.translate(`flags.${metric}`), navigation });
  }
}
