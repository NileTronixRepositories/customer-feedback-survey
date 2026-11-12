import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import {
  FlagActor,
  ResponseFlagDetails,
  flagTypeKey,
} from '../../../shared/models/response-flag.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-response-flag-card',
  imports: [DatePipe, TranslatePipe, ButtonComponent],
  styleUrl: './feedback.css',
  template: `<article class="feedback-panel space-y-4">
    <h3 class="font-bold">{{ typeKey(flag().type) | t }}</h3>
    <dl class="space-y-3 text-sm">
      <div>
        <dt class="font-semibold">{{ 'flags.brief' | t }}</dt>
        <dd class="feedback-text">{{ flag().brief || ('flags.noBrief' | t) }}</dd>
      </div>
      <div>
        <dt class="font-semibold">{{ 'flags.answer' | t }}</dt>
        <dd class="feedback-text">{{ flag().answer || ('flags.unanswered' | t) }}</dd>
      </div>
    </dl>
    <dl class="row g-3 text-xs text-slate-600">
      <div class="col-12 col-md-4">
        <dt>{{ 'flags.createdBy' | t }}</dt>
        <dd>{{ actor(flag().createdBy) }} · {{ flag().createdOnUtc | date: 'medium' }}</dd>
      </div>
      @if (flag().briefUpdatedBy) {
        <div class="col-12 col-md-4">
          <dt>{{ 'flags.briefUpdatedBy' | t }}</dt>
          <dd>
            {{ actor(flag().briefUpdatedBy) }} · {{ flag().briefUpdatedOnUtc | date: 'medium' }}
          </dd>
        </div>
      }
      @if (flag().answeredBy) {
        <div class="col-12 col-md-4">
          <dt>{{ 'flags.answeredBy' | t }}</dt>
          <dd>{{ actor(flag().answeredBy) }} · {{ flag().answeredOnUtc | date: 'medium' }}</dd>
        </div>
      }
    </dl>
    <div class="feedback-actions">
      @if (canEditBrief()) {
        <app-button size="sm" variant="secondary" (pressed)="edit.emit('brief')">{{
          'flags.editBrief' | t
        }}</app-button>
      }
      @if (canAnswer()) {
        <app-button size="sm" variant="secondary" (pressed)="edit.emit('answer')">{{
          (flag().answer ? 'flags.editAnswer' : 'flags.writeAnswer') | t
        }}</app-button>
      }
    </div>
  </article>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponseFlagCardComponent {
  readonly flag = input.required<ResponseFlagDetails>();
  readonly canEditBrief = input(false);
  readonly canAnswer = input(false);
  readonly edit = output<'brief' | 'answer'>();
  readonly typeKey = flagTypeKey;
  private readonly i18n = inject(I18nService);
  actor(value: FlagActor | null): string {
    return (
      (this.i18n.language() === 'ar'
        ? value?.nameAr || value?.nameEn
        : value?.nameEn || value?.nameAr) || '—'
    );
  }
}
