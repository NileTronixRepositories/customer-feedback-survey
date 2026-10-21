import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  BranchEvaluationSettings,
  UpdateBranchEvaluationSettingsRequest,
  validateBranchEvaluationSettings,
} from '../../domain/branch-evaluation-settings.model';
import { BranchEvaluationSettingsService } from '../../data/branch-evaluation-settings.service';

@Injectable()
export class BranchEvaluationSettingsStore {
  private readonly service = inject(BranchEvaluationSettingsService);

  private readonly settingsSignal = signal<BranchEvaluationSettings | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal(false);

  readonly settings = this.settingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();

  readonly usesDefaults = computed(() => this.settingsSignal()?.usesDefaults ?? true);

  load(branchId: string): void {
    if (!branchId) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.service
      .getEvaluationSettings(branchId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (settings) => {
          this.settingsSignal.set(settings);
          this.errorSignal.set(null);
        },
        error: (err: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(err));
        },
      });
  }

  save(
    branchId: string,
    payload: UpdateBranchEvaluationSettingsRequest,
    onSuccess?: () => void,
  ): void {
    const validation = validateBranchEvaluationSettings(payload);
    if (!validation.valid) {
      this.errorSignal.set(validation.errors[0]);
      return;
    }

    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(false);

    this.service
      .updateEvaluationSettings(branchId, payload)
      .pipe(finalize(() => this.savingSignal.set(false)))
      .subscribe({
        next: (updatedSettings) => {
          this.settingsSignal.set(updatedSettings);
          this.successSignal.set(true);
          this.errorSignal.set(null);
          if (onSuccess) {
            onSuccess();
          }
        },
        error: (err: unknown) => {
          this.errorSignal.set(this.extractErrorMessage(err));
          this.successSignal.set(false);
        },
      });
  }

  dismissSuccess(): void {
    this.successSignal.set(false);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'toast.forbiddenDescription';
      }
      if (error.error?.message) {
        return error.error.message;
      }
      if (typeof error.error === 'string') {
        return error.error;
      }
    }
    return 'branchEvaluationSettings.errors.saveFailed';
  }
}
