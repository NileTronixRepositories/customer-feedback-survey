export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogOptions {
  readonly title?: string;
  readonly message: string;
  readonly description?: string;
  readonly itemName?: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: ConfirmDialogVariant;
}

export interface ActiveConfirmDialog extends ConfirmDialogOptions {
  readonly id: number;
  readonly resolve: (value: boolean) => void;
}
