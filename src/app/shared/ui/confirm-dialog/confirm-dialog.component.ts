import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LucideIconData,
  TriangleAlert,
  X,
} from 'lucide-angular';
import { IconComponent } from '../icon/icon.component';
import { ConfirmDialogVariant } from './confirm-dialog.model';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly confirmService = inject(ConfirmDialogService);
  readonly closeIcon = X;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.activeDialog()) {
      this.confirmService.cancel();
    }
  }

  @HostListener('document:keydown.enter')
  onEnter(): void {
    if (this.confirmService.activeDialog()) {
      this.confirmService.accept();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirmService.cancel();
    }
  }

  iconFor(variant: ConfirmDialogVariant): LucideIconData {
    switch (variant) {
      case 'danger':
        return TriangleAlert;
      case 'warning':
        return AlertCircle;
      case 'success':
        return CheckCircle2;
      case 'info':
      default:
        return Info;
    }
  }

  badgeWrapperClass(variant: ConfirmDialogVariant): string {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 text-rose-600 ring-8 ring-rose-500/10 border-rose-200/80';
      case 'warning':
        return 'bg-amber-50 text-amber-600 ring-8 ring-amber-500/10 border-amber-200/80';
      case 'success':
        return 'bg-emerald-50 text-emerald-600 ring-8 ring-emerald-500/10 border-emerald-200/80';
      case 'info':
      default:
        return 'bg-cyan-50 text-[var(--theme-color-secondary)] ring-8 ring-cyan-500/10 border-cyan-200/80';
    }
  }

  confirmButtonClass(variant: ConfirmDialogVariant): string {
    switch (variant) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30 focus:ring-rose-500';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/30 focus:ring-amber-500';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-600/30 focus:ring-emerald-500';
      case 'info':
      default:
        return 'bg-[var(--theme-color-primary)] hover:bg-[var(--theme-color-secondary)] text-white shadow-cyan-900/20 focus:ring-[var(--theme-color-accent)]';
    }
  }
}
