import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class ModalComponent {
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private activeDialog: HTMLElement | null = null;
  private returnFocus: HTMLElement | null = null;
  readonly open = input(false);
  readonly title = input('');
  readonly subtitle = input('');
  readonly icon = input('');
  readonly size = input<ModalSize>('md');
  readonly closeOnBackdrop = input(true);
  readonly closed = output<void>();

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (this.open() && dialog) {
        if (dialog !== this.activeDialog) {
          this.returnFocus = this.document.activeElement as HTMLElement | null;
          this.activeDialog = dialog;
          dialog.focus();
        }
      } else {
        this.restoreFocus();
      }
    });
    inject(DestroyRef).onDestroy(() => this.restoreFocus());
  }

  onKeydown(event: KeyboardEvent): void {
    const dialog = this.dialog()?.nativeElement;
    const dialogs = this.document.querySelectorAll('[role="dialog"]');
    if (!this.open() || !dialog || dialogs.item(dialogs.length - 1) !== dialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((control) => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) {
      event.preventDefault();
      dialog.focus();
    } else if (
      event.shiftKey &&
      (this.document.activeElement === first || this.document.activeElement === dialog)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      (this.document.activeElement === last || this.document.activeElement === dialog)
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreFocus(): void {
    if (!this.activeDialog) return;
    const target = this.returnFocus;
    this.activeDialog = null;
    this.returnFocus = null;
    if (target?.isConnected) target.focus();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
