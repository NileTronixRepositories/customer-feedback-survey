import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Award, ChevronRight, Eye, HelpCircle, Star, ThumbsUp } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon.component';
import { BestRatedQuestion } from '../../models/historical-survey.model';
import { DashboardDetailsNavigation } from '../../../features/reports/dashboard-drill-down/domain/dashboard-drill-down.model';

@Component({
  selector: 'app-best-rated-questions',
  standalone: true,
  imports: [DecimalPipe, IconComponent, TranslatePipe],
  templateUrl: './best-rated-questions.component.html',
  styleUrl: './best-rated-questions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BestRatedQuestionsComponent {
  private readonly i18n = inject(I18nService);

  readonly questions = input<readonly BestRatedQuestion[] | null | undefined>([]);
  readonly loading = input(false);
  readonly drillDown = output<DashboardDetailsNavigation>();
  readonly navigationSelected = output<{
    title: string;
    navigation: DashboardDetailsNavigation;
  }>();
  readonly questionSelected = output<BestRatedQuestion>();

  readonly safeQuestions = computed<readonly BestRatedQuestion[]>(() => this.questions() ?? []);

  readonly trophyIcon = Award;
  readonly starIcon = Star;
  readonly thumbsUpIcon = ThumbsUp;
  readonly questionIcon = HelpCircle;
  readonly eyeIcon = Eye;
  readonly chevronRightIcon = ChevronRight;

  questionText(item: BestRatedQuestion): string {
    if (this.i18n.language() === 'ar') {
      return item.questionTextAr || item.questionTextEn || '';
    }
    return item.questionTextEn || item.questionTextAr || '';
  }

  templateName(item: BestRatedQuestion): string {
    if (this.i18n.language() === 'ar') {
      return item.templateNameAr || item.templateNameEn || '';
    }
    return item.templateNameEn || item.templateNameAr || '';
  }

  onDrillDown(item: BestRatedQuestion): void {
    if (item.detailsNavigation) {
      this.drillDown.emit(item.detailsNavigation);
      this.navigationSelected.emit({
        title: this.questionText(item),
        navigation: item.detailsNavigation,
      });
    }
    this.questionSelected.emit(item);
  }
}
