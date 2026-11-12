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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { Flag } from 'lucide-angular';
import { AuthStore } from '../../auth/presentation/state/auth.store';
import { I18nService } from '../../../core/services/i18n.service';
import {
  FLAG_PERMISSIONS,
  FLAG_TYPES,
  ResponseFlagDetails,
  flagType,
  flagTypeKey,
} from '../../../shared/models/response-flag.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { DashboardResponseDetailsModalComponent } from '../../reports/dashboard-drill-down/presentation/components/dashboard-response-details-modal/dashboard-response-details-modal.component';
import { ResponseFlagsService } from '../data/response-flags.service';
import { FlaggedResponseDetails } from '../domain/response-flags.model';
import { ResponseFlagCardComponent } from './response-flag-card.component';
import { feedbackError } from './feedback-error';

@Component({
  selector: 'app-flagged-response-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonComponent,
    PageHeaderComponent,
    ModalComponent,
    DashboardResponseDetailsModalComponent,
    ResponseFlagCardComponent,
  ],
  templateUrl: './flagged-response-page.component.html',
  styleUrl: './feedback.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlaggedResponsePageComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthStore);
  readonly i18n = inject(I18nService);
  private readonly api = inject(ResponseFlagsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly icon = Flag;
  readonly types = FLAG_TYPES;
  readonly typeKey = flagTypeKey;
  readonly permissions = FLAG_PERMISSIONS;
  readonly data = signal<FlaggedResponseDetails | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly success = signal('');
  readonly formError = signal('');
  readonly denied = signal(false);
  readonly surveyOpen = signal(false);
  readonly editing = signal<'create' | 'brief' | 'answer' | null>(null);
  readonly selectedFlag = signal<ResponseFlagDetails | null>(null);
  readonly form = this.fb.nonNullable.group({
    type: '1',
    brief: ['', Validators.maxLength(1000)],
    answer: ['', Validators.maxLength(4000)],
  });
  private get id(): string {
    return this.route.snapshot.paramMap.get('responseId') ?? '';
  }
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .details(this.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error) => {
          this.error.set(feedbackError(error));
          this.denied.set(error.status === 403);
        },
      });
  }
  can(permission: string): boolean {
    return !this.denied() && this.auth.canUseResponseFlags(permission);
  }
  localized(en: string | null | undefined, ar: string | null | undefined): string {
    return (this.i18n.language() === 'ar' ? ar || en : en || ar) || '—';
  }
  openEditor(mode: 'create' | 'brief' | 'answer', flag: ResponseFlagDetails | null = null): void {
    if (
      !this.can(
        mode === 'create'
          ? FLAG_PERMISSIONS.create
          : mode === 'brief'
            ? FLAG_PERMISSIONS.editBrief
            : FLAG_PERMISSIONS.answer,
      )
    )
      return;
    this.selectedFlag.set(flag);
    this.editing.set(mode);
    this.formError.set('');
    this.form.reset({
      type: String(flag?.type ?? 1),
      brief: mode === 'brief' ? (flag?.brief ?? '') : '',
      answer: mode === 'answer' ? (flag?.answer ?? '') : '',
    });
  }
  closeEditor(): void {
    if (!this.saving()) this.editing.set(null);
  }
  save(): void {
    const mode = this.editing();
    if (!mode || this.saving()) return;
    const permission =
      mode === 'create'
        ? FLAG_PERMISSIONS.create
        : mode === 'brief'
          ? FLAG_PERMISSIONS.editBrief
          : FLAG_PERMISSIONS.answer;
    if (!this.can(permission)) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const brief = value.brief.trim();
    const answer = value.answer.trim();
    const type = flagType(value.type);
    if (
      this.form.invalid ||
      (mode !== 'answer' && !brief) ||
      (mode === 'answer' && !answer) ||
      (mode === 'create' && (!type || (value.answer.length > 0 && !answer)))
    ) {
      this.formError.set('flags.validationError');
      return;
    }
    const request =
      mode === 'create'
        ? this.api.create(this.id, {
            type: type!,
            brief,
            ...(this.can(FLAG_PERMISSIONS.answer) && answer ? { answer } : {}),
          })
        : mode === 'brief'
          ? this.api.editBrief(this.selectedFlag()!.flagId, brief)
          : this.api.answer(this.selectedFlag()!.flagId, answer);
    this.saving.set(true);
    this.formError.set('');
    request
      .pipe(
        switchMap((change) =>
          mode === 'create' ? this.api.details(this.id) : this.api.flag(change.flagId),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (result) => {
          if ('flags' in result) this.data.set(result);
          else
            this.data.update((data) =>
              data
                ? {
                    ...data,
                    flags: data.flags.map((flag) =>
                      flag.flagId === result.flagId ? result : flag,
                    ),
                  }
                : data,
            );
          this.editing.set(null);
          this.success.set('flags.saved');
        },
        error: (error) => {
          this.formError.set(feedbackError(error));
          this.denied.set(error.status === 403);
        },
      });
  }
}
