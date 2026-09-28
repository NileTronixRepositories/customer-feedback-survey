import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { ActiveConfirmDialog, ConfirmDialogOptions } from './confirm-dialog.model';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly i18n = inject(I18nService);
  private readonly dialogSignal = signal<ActiveConfirmDialog | null>(null);
  private nextId = 1;

  readonly activeDialog = this.dialogSignal.asReadonly();

  confirm(options: ConfirmDialogOptions | string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const current = this.dialogSignal();
      if (current) {
        current.resolve(false);
      }

      const opts: ConfirmDialogOptions =
        typeof options === 'string' ? { message: options } : options;

      const variant = opts.variant ?? 'danger';

      const dialog: ActiveConfirmDialog = {
        id: this.nextId++,
        title: opts.title ?? this.i18n.translate('common.confirmAction'),
        message: opts.message,
        description: opts.description,
        itemName: opts.itemName,
        confirmText: opts.confirmText ?? this.i18n.translate('common.confirm'),
        cancelText: opts.cancelText ?? this.i18n.translate('common.cancel'),
        variant,
        resolve: (result: boolean) => {
          this.dialogSignal.set(null);
          resolve(result);
        },
      };

      this.dialogSignal.set(dialog);
    });
  }

  accept(): void {
    const dialog = this.dialogSignal();
    if (dialog) {
      dialog.resolve(true);
    }
  }

  cancel(): void {
    const dialog = this.dialogSignal();
    if (dialog) {
      dialog.resolve(false);
    }
  }
}
