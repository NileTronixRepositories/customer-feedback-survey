import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Calculator } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon.component';
import {
  SCORE_CALCULATION_MODES,
  ScoreCalculationMode,
} from '../../models/score-calculation-mode.model';

@Component({
  selector: 'app-score-mode-selector',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './score-mode-selector.component.html',
  styleUrl: './score-mode-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreModeSelectorComponent {
  private readonly i18n = inject(I18nService);

  readonly selectedMode = input<ScoreCalculationMode>('RootQuestions');
  readonly size = input<'sm' | 'md'>('sm');
  readonly disabled = input(false);
  readonly showIcon = input(true);

  readonly modeChange = output<ScoreCalculationMode>();

  readonly modes = SCORE_CALCULATION_MODES;
  readonly calculatorIcon = Calculator;

  readonly isRtl = computed(() => this.i18n.isRtl());

  selectMode(mode: ScoreCalculationMode): void {
    if (this.disabled() || this.selectedMode() === mode) {
      return;
    }
    this.modeChange.emit(mode);
  }

  getLabel(mode: (typeof SCORE_CALCULATION_MODES)[number]): string {
    return this.isRtl() ? mode.labelAr : mode.labelEn;
  }
}
