import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FLAG_TYPES, flagTypeKey } from '../../../shared/models/response-flag.model';

export interface OperatorFlagDraft {
  id: number;
  type: string;
  brief: string;
}

@Component({
  selector: 'app-operator-flags-input',
  host: {
    class: 'block',
  },
  imports: [FormsModule, TranslatePipe],
  template: `
    <section
      class="scroll-mt-16 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4 transition hover:border-teal-200/80"
      aria-labelledby="operator-flags-heading"
    >
      <!-- Header of Flags Section -->
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-color-primary,#148496)] to-[var(--theme-color-secondary,#0f6f7f)] text-white shadow-2xs ring-2 ring-teal-500/10"
          >
            <i class="fa-solid fa-comments text-base"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 id="operator-flags-heading" class="text-xs sm:text-sm font-black text-slate-900 truncate">
                {{ 'flags.submissionTitle' | t }}
              </h3>
              @if (flags().length > 0) {
                <span
                  class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-teal-50 text-[var(--theme-color-primary,#148496)] border border-teal-200/70"
                >
                  {{ flags().length }}
                </span>
              }
            </div>
            <p class="text-[11px] font-semibold text-slate-500 mt-0.5 leading-normal">
              {{ 'flags.submissionHint' | t }}
            </p>
          </div>
        </div>

        <!-- Header Add Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-teal-50/80 text-[var(--theme-color-primary,#148496)] border border-teal-200/80 text-xs font-bold hover:bg-teal-100/80 transition active:scale-95 cursor-pointer shrink-0"
          (click)="add()"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          <span class="hidden sm:inline">{{ 'flags.add' | t }}</span>
        </button>
      </div>

      <!-- Empty State -->
      @if (flags().length === 0) {
        <div
          class="rounded-xl border-2 border-dashed border-slate-200/90 bg-slate-50/50 p-6 text-center transition hover:border-teal-300 hover:bg-teal-50/20 cursor-pointer"
          (click)="add()"
        >
          <div
            class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[var(--theme-color-primary,#148496)] border border-teal-200/70 mb-2.5 shadow-2xs"
          >
            <i class="fa-regular fa-comment-dots text-lg"></i>
          </div>
          <p class="text-xs font-bold text-slate-700 mb-0.5">
            {{ 'flags.add' | t }}
          </p>
          <p class="text-[11px] font-medium text-slate-400 max-w-sm mx-auto mb-3">
            {{ 'flags.submissionHint' | t }}
          </p>
          <span
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-[var(--theme-color-primary,#148496)] shadow-2xs hover:bg-slate-50"
          >
            <i class="fa-solid fa-plus text-[11px]"></i>
            <span>{{ 'flags.add' | t }}</span>
          </span>
        </div>
      }

      <!-- List of Added Flags -->
      @if (flags().length > 0) {
        <div class="space-y-3">
          @for (flag of flags(); track flag.id; let idx = $index) {
            <div
              class="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3.5 sm:p-4 shadow-2xs transition hover:border-teal-200/80 hover:bg-white space-y-3 relative"
            >
              <!-- Card Top Row: Numbering, Type Pill & Delete Button -->
              <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center justify-center h-5 w-5 rounded-md bg-teal-100/70 text-[var(--theme-color-primary,#148496)] font-mono text-[10px] font-black"
                  >
                    #{{ idx + 1 }}
                  </span>
                  <span class="text-xs font-bold text-slate-700">
                    @if (flag.type) {
                      <span class="inline-flex items-center gap-1.5">
                        <i [class]="getFlagIcon(flag.type)"></i>
                        <span>{{ typeKey(+flag.type) | t }}</span>
                      </span>
                    } @else {
                      <span class="text-slate-400 italic">{{ 'flags.selectType' | t }}</span>
                    }
                  </span>
                </div>

                <button
                  type="button"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition active:scale-95 cursor-pointer"
                  (click)="remove(flag.id)"
                  [title]="'common.delete' | t"
                >
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>

              <!-- Form Fields: Type (col-span-4) & Brief (col-span-8) -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <!-- 1. Type Select -->
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    <i class="fa-solid fa-tag text-[10px] text-[var(--theme-color-primary,#148496)] me-1"></i>
                    {{ 'flags.type' | t }}
                    <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative flex items-center">
                    <select
                      class="h-10 w-full appearance-none rounded-xl border border-slate-200/90 bg-white ps-3 pe-8 text-xs font-bold text-slate-800 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[var(--theme-color-primary)] focus:ring-2 focus:ring-[var(--theme-color-primary)]/15 cursor-pointer"
                      [class.border-rose-400]="!flag.type"
                      [class.bg-rose-50/30]="!flag.type"
                      [ngModel]="flag.type"
                      (ngModelChange)="update(flag.id, 'type', $event)"
                      required
                    >
                      <option value="">{{ 'flags.selectType' | t }}</option>
                      @for (type of types; track type) {
                        <option [value]="type">{{ typeKey(type) | t }}</option>
                      }
                    </select>
                    <span class="pointer-events-none absolute end-2.5 inset-y-0 flex items-center text-slate-400">
                      <i class="fa-solid fa-chevron-down text-[10px]"></i>
                    </span>
                  </div>
                  @if (!flag.type) {
                    <span class="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                      <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
                      <span>{{ 'flags.typeRequired' | t }}</span>
                    </span>
                  }
                </div>

                <!-- 2. Brief Textarea -->
                <div class="md:col-span-8">
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="text-xs font-bold text-slate-700">
                      <i class="fa-solid fa-pen-clip text-[10px] text-slate-400 me-1"></i>
                      {{ 'flags.optionalBrief' | t }}
                    </label>
                    <span class="text-[10px] font-semibold text-slate-400">
                      {{ flag.brief.length }} / 1000
                    </span>
                  </div>
                  <textarea
                    class="w-full resize-y rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[var(--theme-color-primary)] focus:ring-2 focus:ring-[var(--theme-color-primary)]/15 min-h-[60px] max-h-40"
                    rows="2"
                    maxlength="1000"
                    [placeholder]="'flags.briefPlaceholder' | t"
                    [ngModel]="flag.brief"
                    (ngModelChange)="update(flag.id, 'brief', $event)"
                  ></textarea>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Bottom Action Bar -->
        <div class="pt-1 flex items-center justify-between">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 text-xs font-bold text-[var(--theme-color-primary,#148496)] transition active:scale-95 cursor-pointer"
            (click)="add()"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            <span>{{ 'flags.add' | t }}</span>
          </button>

          <span class="text-[11px] font-semibold text-slate-400">
            {{ flags().length }} {{ 'flags.items' | t }}
          </span>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorFlagsInputComponent {
  readonly flags = model<readonly OperatorFlagDraft[]>([]);
  readonly types = FLAG_TYPES;
  readonly typeKey = flagTypeKey;
  private nextId = 0;

  getFlagIcon(type: string | number): string {
    const val = Number(type);
    if (val === 1) return 'fa-solid fa-triangle-exclamation text-amber-500 text-xs';
    if (val === 2) return 'fa-solid fa-lightbulb text-teal-600 text-xs';
    if (val === 3) return 'fa-solid fa-comment-dots text-sky-600 text-xs';
    return 'fa-solid fa-flag text-slate-400 text-xs';
  }

  add(): void {
    this.flags.update((flags) => [...flags, { id: ++this.nextId, type: '', brief: '' }]);
  }

  remove(id: number): void {
    this.flags.update((flags) => flags.filter((flag) => flag.id !== id));
  }

  update(id: number, field: 'type' | 'brief', value: string): void {
    this.flags.update((flags) =>
      flags.map((flag) => (flag.id === id ? { ...flag, [field]: value } : flag)),
    );
  }
}
