import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AlertCircle, History, Info } from 'lucide-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-historical-warning-banner',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    @if (isVisible()) {
      <div
        class="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 shadow-2xs"
        role="alert"
      >
        <app-icon [icon]="icon()" [size]="16" class="text-amber-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="font-semibold leading-relaxed">{{ message() | t }}</p>
          @if (subMessage()) {
            <p class="text-[11px] text-amber-700 mt-0.5 leading-normal">{{ subMessage()! | t }}</p>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalWarningBannerComponent {
  readonly show = input<boolean | undefined>(undefined);
  readonly requestedModeAvailable = input<boolean | null | undefined>(undefined);
  readonly storedBaselineResponsesCount = input<number | null | undefined>(undefined);
  readonly storedBaselineCount = input<number | null | undefined>(undefined);
  readonly message = input<string>('historicalCompleteness.modeUnavailable');
  readonly subMessage = input<string | null>(null);
  readonly icon = input(History);

  readonly isVisible = computed(() => {
    if (this.show() !== undefined) {
      return Boolean(this.show());
    }
    if (this.requestedModeAvailable() !== undefined && this.requestedModeAvailable() !== null) {
      return !this.requestedModeAvailable();
    }
    return true;
  });
}
