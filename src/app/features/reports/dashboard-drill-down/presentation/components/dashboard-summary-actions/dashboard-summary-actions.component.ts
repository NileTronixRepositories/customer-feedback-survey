import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import {
  DashboardDetailsNavigation,
  DashboardSummaryActions,
} from '../../../domain/dashboard-drill-down.model';

@Component({
  selector: 'app-dashboard-summary-actions',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './dashboard-summary-actions.component.html',
  styleUrl: './dashboard-summary-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSummaryActionsComponent {
  private readonly i18n = inject(I18nService);
  readonly totalResponses = input.required<number>();
  readonly complaints = input.required<number>();
  readonly voiceAnswers = input.required<number>();
  readonly actions = input.required<DashboardSummaryActions>();
  readonly navigationSelected = output<{ title: string; navigation: DashboardDetailsNavigation }>();

  select(navigation: DashboardDetailsNavigation | null, titleKey: string): void {
    if (navigation) {
      this.navigationSelected.emit({ title: this.i18n.translate(titleKey), navigation });
    }
  }
}
