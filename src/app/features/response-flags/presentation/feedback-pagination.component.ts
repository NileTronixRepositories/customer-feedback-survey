import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-feedback-pagination',
  imports: [TranslatePipe],
  template: `<nav
    class="flex flex-wrap items-center justify-between gap-3 text-xs py-2"
    [attr.aria-label]="'flags.pagination' | t"
  >
    <div class="flex items-center gap-2">
      <span
        class="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 font-bold text-slate-700 shadow-2xs"
      >
        <i class="fa-solid fa-layer-group text-[var(--theme-color-primary,#148496)] text-xs"></i>
        <span>{{ page() }} / {{ pages }}</span>
        <span class="text-slate-300">|</span>
        <span class="text-slate-500 font-semibold">{{ total() }} {{ 'flags.items' | t }}</span>
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <label class="flex items-center gap-2 font-bold text-slate-600 text-xs">
        <span class="text-slate-500">{{ 'flags.pageSize' | t }}</span>
        <div class="relative flex items-center">
          <select
            class="h-9 rounded-xl border border-slate-200/90 bg-white ps-3 pe-8 text-xs font-bold text-slate-700 shadow-2xs transition appearance-none cursor-pointer hover:border-slate-300 focus:border-[var(--theme-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-color-primary)]/20"
            [value]="size()"
            (change)="sizeChanged.emit(+$any($event.target).value)"
            [disabled]="loading()"
          >
            @for (value of [10, 25, 50]; track value) {
              <option [value]="value">{{ value }}</option>
            }
          </select>
          <span
            class="pointer-events-none absolute end-2.5 inset-y-0 flex items-center text-slate-400"
          >
            <i class="fa-solid fa-chevron-down text-[10px]"></i>
          </span>
        </div>
      </label>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          [disabled]="loading() || page() <= 1"
          (click)="pageChanged.emit(page() - 1)"
        >
          <i
            [class]="
              i18n.isRtl()
                ? 'fa-solid fa-chevron-right text-[11px]'
                : 'fa-solid fa-chevron-left text-[11px]'
            "
          ></i>
          <span>{{ 'flags.previous' | t }}</span>
        </button>

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          [disabled]="loading() || page() >= pages"
          (click)="pageChanged.emit(page() + 1)"
        >
          <span>{{ 'flags.next' | t }}</span>
          <i
            [class]="
              i18n.isRtl()
                ? 'fa-solid fa-chevron-left text-[11px]'
                : 'fa-solid fa-chevron-right text-[11px]'
            "
          ></i>
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <label class="flex items-center gap-2 font-bold text-slate-600 text-xs">
        <span class="text-slate-500">{{ 'flags.pageSize' | t }}</span>
        <div class="relative flex items-center">
          <select
            class="h-9 rounded-xl border border-slate-200/90 bg-white ps-3 pe-8 text-xs font-bold text-slate-700 shadow-2xs transition appearance-none cursor-pointer hover:border-slate-300 focus:border-[var(--theme-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-color-primary)]/20"
            [value]="size()"
            (change)="sizeChanged.emit(+$any($event.target).value)"
            [disabled]="loading()"
          >
            @for (value of [10, 25, 50]; track value) {
              <option [value]="value">{{ value }}</option>
            }
          </select>
          <span class="pointer-events-none absolute end-2.5 inset-y-0 flex items-center text-slate-400">
            <i class="fa-solid fa-chevron-down text-[10px]"></i>
          </span>
        </div>
      </label>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          [disabled]="loading() || page() <= 1"
          (click)="pageChanged.emit(page() - 1)"
        >
          <i
            [class]="i18n.isRtl() ? 'fa-solid fa-chevron-right text-[11px]' : 'fa-solid fa-chevron-left text-[11px]'"
          ></i>
          <span>{{ 'flags.previous' | t }}</span>
        </button>

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          [disabled]="loading() || page() >= pages"
          (click)="pageChanged.emit(page() + 1)"
        >
          <span>{{ 'flags.next' | t }}</span>
          <i
            [class]="i18n.isRtl() ? 'fa-solid fa-chevron-left text-[11px]' : 'fa-solid fa-chevron-right text-[11px]'"
          ></i>
        </button>
      </div>
    </div>
  </nav>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackPaginationComponent {
  readonly i18n = inject(I18nService);
  readonly page = input(1);
  readonly size = input(10);
  readonly total = input(0);
  readonly loading = input(false);
  readonly pageChanged = output<number>();
  readonly sizeChanged = output<number>();
  get pages(): number {
    return Math.max(1, Math.ceil(this.total() / this.size()));
  }
}
