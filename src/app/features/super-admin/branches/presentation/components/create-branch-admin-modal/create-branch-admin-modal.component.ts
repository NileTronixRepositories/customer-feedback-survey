import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserPlus } from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../../shared/ui/modal/modal.component';
import {
  BranchSelection,
  CreateBranchAdminPayload,
} from '../../../domain/branch.model';

@Component({
  selector: 'app-create-branch-admin-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    TranslatePipe,
  ],
  templateUrl: './create-branch-admin-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBranchAdminModalComponent {
  readonly open = input(false);
  readonly loading = input(false);
  readonly branches = input<readonly BranchSelection[]>([]);
  readonly selectedBranch = input<BranchSelection | null>(null);

  readonly closed = output<void>();
  readonly submitted = output<CreateBranchAdminPayload>();

  readonly i18n = inject(I18nService);
  private readonly formBuilder = inject(FormBuilder);

  readonly userPlusIcon = UserPlus;
  readonly form = this.formBuilder.nonNullable.group({
    branchId: ['', Validators.required],
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.form.reset();
      this.form.controls.branchId.setValue(this.selectedBranch()?.id ?? '');
    });
  }

  close(): void {
    if (this.loading()) {
      return;
    }

    this.form.reset();
    this.closed.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }

  fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (field === 'email' && control.hasError('email')) {
      return this.i18n.translate('auth.emailInvalid');
    }
    if (field === 'password' && control.hasError('minlength')) {
      return this.i18n.translate('auth.passwordLength');
    }

    return this.i18n.translate('branches.fieldRequired');
  }

  branchDisplayName(branch: BranchSelection): string {
    const primary = this.i18n.language() === 'ar' ? branch.nameAr : branch.nameEn;
    const fallback = this.i18n.language() === 'ar' ? branch.nameEn : branch.nameAr;
    const name = primary.trim() || fallback.trim();
    return branch.code ? `${name} - ${branch.code}` : name;
  }
}
