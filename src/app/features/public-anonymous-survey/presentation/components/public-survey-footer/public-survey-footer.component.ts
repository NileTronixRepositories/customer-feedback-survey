import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../../../core/services/i18n.service';
import { BRAND_ASSETS } from '../../../../../core/theme/brand-assets';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-public-survey-footer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './public-survey-footer.component.html',
  styleUrl: './public-survey-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSurveyFooterComponent {
  readonly i18n = inject(I18nService);
  readonly brandAssets = BRAND_ASSETS;
}
