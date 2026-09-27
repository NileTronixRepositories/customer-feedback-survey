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

      const isAr = this.i18n.language() === 'ar';
      const variant = opts.variant ?? 'danger';

      const defaultTitle = isAr ? 'تأكيد العملية' : 'Confirm Action';
      const defaultConfirmText =
        opts.confirmText ?? (isAr ? 'تأكيد' : 'Confirm');
      const defaultCancelText = opts.cancelText ?? (isAr ? 'إلغاء' : 'Cancel');

      const dialog: ActiveConfirmDialog = {
        id: this.nextId++,
        title: opts.title ?? defaultTitle,
        message: opts.message,
        description: opts.description,
        itemName: opts.itemName,
        confirmText: defaultConfirmText,
        cancelText: defaultCancelText,
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
