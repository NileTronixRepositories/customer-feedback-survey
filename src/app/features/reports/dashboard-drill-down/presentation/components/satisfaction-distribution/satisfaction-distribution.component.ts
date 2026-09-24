import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import {
  DashboardDetailsNavigation,
  DashboardSatisfactionItem,
  SatisfactionCategory,
} from '../../../domain/dashboard-drill-down.model';

@Component({
  selector: 'app-satisfaction-distribution',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './satisfaction-distribution.component.html',
  styleUrl: './satisfaction-distribution.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatisfactionDistributionComponent {
  private readonly i18n = inject(I18nService);

  readonly items = input.required<readonly DashboardSatisfactionItem[]>();
  readonly navigationSelected = output<{
    title: string;
    navigation: DashboardDetailsNavigation;
  }>();

  readonly normalizedItems = computed(() => {
    const itemsByCategory = new Map(this.items().map((item) => [item.category, item]));
    return (['Satisfied', 'Neutral', 'Unhappy'] as const).map(
      (category) =>
        itemsByCategory.get(category) ?? {
          category,
          responsesCount: 0,
          percentage: 0,
          detailsNavigation: null,
        },
    );
  });

  readonly chartBackground = computed(() => {
    const values = this.normalizedItems();
    const satisfied = this.clamp(values[0]?.percentage ?? 0);
    const neutral = this.clamp(values[1]?.percentage ?? 0);
    const unhappy = this.clamp(values[2]?.percentage ?? 0);
    const total = satisfied + neutral + unhappy;
    if (total <= 0) {
      return 'conic-gradient(var(--distribution-empty) 0 100%)';
    }

    const satisfiedEnd = (satisfied / total) * 100;
    const neutralEnd = satisfiedEnd + (neutral / total) * 100;
    return `conic-gradient(
      var(--distribution-satisfied) 0 ${satisfiedEnd}%,
      var(--distribution-neutral) ${satisfiedEnd}% ${neutralEnd}%,
      var(--distribution-unhappy) ${neutralEnd}% 100%
    )`;
  });

  select(item: DashboardSatisfactionItem): void {
    if (!item.detailsNavigation || item.responsesCount <= 0) {
      return;
    }

    this.navigationSelected.emit({
      title: this.i18n.translate(this.categoryTitleKey(item.category)),
      navigation: item.detailsNavigation,
    });
  }

  isActionable(item: DashboardSatisfactionItem): boolean {
    return item.responsesCount > 0 && item.detailsNavigation !== null;
  }

  categoryKey(category: SatisfactionCategory): string {
    return `dashboardDrillDown.${category.toLowerCase()}`;
  }

  categoryTitleKey(category: SatisfactionCategory): string {
    return `dashboardDrillDown.${category.toLowerCase()}Responses`;
  }

  categoryClass(category: SatisfactionCategory): string {
    return `distribution-key--${category.toLowerCase()}`;
  }

  private clamp(value: number): number {
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
  }
}
