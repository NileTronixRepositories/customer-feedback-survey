import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-feedback-access-page',
  imports: [TranslatePipe],
  template: `<section class="rounded-xl bg-white p-6">
    <h1 class="text-xl font-bold">{{ 'flags.workspace' | t }}</h1>
    <p class="mt-3" role="status">{{ 'flags.noViewPermission' | t }}</p>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackAccessPageComponent {}
