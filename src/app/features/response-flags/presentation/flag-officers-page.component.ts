import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin, map, Subscription } from 'rxjs';
import { AuthStore } from '../../auth/presentation/state/auth.store';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FLAG_CAPABILITIES } from '../../../shared/models/response-flag.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { UserPasswordResetService } from '../../auth/data/user-password-reset.service';
import { OperatorsService } from '../../department-admin/operators/data/operators.service';
import { OperatorDepartmentSelection } from '../../department-admin/operators/domain/operator.model';
import { FlagOfficersService } from '../data/flag-officers.service';
import {
  FeedbackPage,
  FlagCapabilityRole,
  FlagOfficerDetails,
} from '../domain/response-flags.model';
import { FeedbackPaginationComponent } from './feedback-pagination.component';
import { feedbackError } from './feedback-error';

@Component({
  selector: 'app-flag-officers-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    ModalComponent,
    ResetPasswordModalComponent,
    FeedbackPaginationComponent,
  ],
  providers: [OperatorsService],
  templateUrl: './flag-officers-page.component.html',
  styleUrl: './flag-officers-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagOfficersPageComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly i18n = inject(I18nService);
  private readonly api = inject(FlagOfficersService);
  private readonly departmentsApi = inject(OperatorsService);
  private readonly resetApi = inject(UserPasswordResetService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal<FeedbackPage<FlagOfficerDetails> | null>(null);
  readonly departments = signal<readonly OperatorDepartmentSelection[]>([]);
  readonly selected = signal<FlagOfficerDetails | null>(null);
  readonly roleOptions = signal<readonly FlagCapabilityRole[]>([]);
  readonly selectedRoleIds = signal<ReadonlySet<string>>(new Set());
  readonly mode = signal<'create' | 'view' | 'edit' | 'roles' | null>(null);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly success = signal('');
  readonly createdOfficerId = signal('');
  readonly resetTarget = signal<FlagOfficerDetails | null>(null);
  readonly denied = signal(false);
  readonly showPassword = signal(false);

  private listRequest?: Subscription;
  private detailsRequest?: Subscription;

  readonly filters = this.fb.nonNullable.group({
    searchText: '',
    departmentId: '',
    orderSort: 'Newest',
    pageSize: 10,
  });

  readonly form = this.fb.nonNullable.group({
    departmentId: '',
    userName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
    nameEn: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(30)],
  });

  readonly activeOfficersCount = computed(
    () => this.page()?.data.filter((officer) => officer.isActive).length ?? 0,
  );

  readonly inactiveOfficersCount = computed(
    () => this.page()?.data.filter((officer) => !officer.isActive).length ?? 0,
  );

  readonly departmentsCount = computed(() => {
    const list = this.page()?.data ?? [];
    return new Set(list.map((officer) => officer.departmentId)).size;
  });

  readonly hasActiveFilters = computed(() => {
    const value = this.filters.value;
    return Boolean(value.searchText?.trim() || value.departmentId);
  });

  readonly modalTitle = computed(() => {
    const m = this.mode();
    if (m === 'create') return 'flags.addOfficer';
    if (m === 'edit') return 'flags.editOfficer';
    if (m === 'roles') return 'flags.managePermissions';
    if (m === 'view') return 'flags.officerDetails';
    return '';
  });

  readonly modalSubtitle = computed(() => {
    const m = this.mode();
    if (m === 'create') return 'flags.addOfficerSubtitle';
    if (m === 'edit') return 'flags.editOfficerSubtitle';
    if (m === 'roles') return 'flags.managePermissionsSubtitle';
    if (m === 'view') return 'flags.officerDetailsSubtitle';
    return '';
  });

  readonly modalIcon = computed(() => {
    const m = this.mode();
    if (m === 'create') return 'fa-solid fa-user-plus';
    if (m === 'edit') return 'fa-solid fa-user-pen';
    if (m === 'roles') return 'fa-solid fa-shield-halved';
    if (m === 'view') return 'fa-solid fa-id-card';
    return '';
  });

  ngOnInit(): void {
    this.load();
    if (this.auth.userType() === 'SuperAdmin')
      this.departmentsApi
        .departmentSelection()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (items) => this.departments.set(items),
          error: (error) => this.reportError(error),
        });
  }

  private reportError(error: unknown, inForm = false): void {
    const key = feedbackError(error);
    (inForm ? this.formError : this.error).set(key);
    if (key === 'flags.forbidden') this.denied.set(true);
  }

  can(action: string): boolean {
    return !this.denied() && this.auth.canManageFlagOfficers(action);
  }

  localized(en: string | null | undefined, ar: string | null | undefined): string {
    return (this.i18n.language() === 'ar' ? ar || en : en || ar) || '—';
  }

  getInitials(officer: FlagOfficerDetails): string {
    const name = this.localized(officer.nameEn, officer.nameAr);
    if (!name || name === '—') return 'FO';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  togglePassword(): void {
    this.showPassword.update((val) => !val);
  }

  clearSearchText(): void {
    this.filters.patchValue({ searchText: '' });
    this.load(1);
  }

  load(pageNumber = 1): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    const value = this.filters.getRawValue();
    this.listRequest = this.api
      .list({
        ...value,
        pageNumber,
        searchText: value.searchText.trim(),
        departmentId:
          this.auth.userType() === 'SuperAdmin' ? value.departmentId || undefined : undefined,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => this.page.set(page),
        error: (error) => {
          this.error.set(feedbackError(error));
          this.denied.set(error.status === 403);
        },
      });
  }

  clear(): void {
    this.filters.patchValue({
      searchText: '',
      departmentId: '',
      orderSort: 'Newest',
    });
    this.load(1);
  }

  changeSize(size: number): void {
    this.filters.patchValue({ pageSize: size });
    this.load();
  }

  create(): void {
    if (!this.can('Create')) return;
    this.selected.set(null);
    this.form.reset();
    this.form.enable();
    this.showPassword.set(false);
    this.formError.set('');
    this.form.controls.departmentId.setValidators(
      this.auth.userType() === 'SuperAdmin' ? Validators.required : null,
    );
    this.form.controls.departmentId.updateValueAndValidity();
    this.mode.set('create');
  }

  open(id: string, mode: 'view' | 'edit' | 'roles'): void {
    this.detailsRequest?.unsubscribe();
    this.mode.set(mode);
    this.selected.set(null);
    this.formError.set('');
    this.detailLoading.set(true);
    const roles = mode === 'roles' ? this.api.roles() : null;
    this.detailsRequest = (
      roles
        ? forkJoin({ officer: this.api.details(id), roles })
        : this.api
            .details(id)
            .pipe(map((officer) => ({ officer, roles: [] as readonly FlagCapabilityRole[] })))
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.detailLoading.set(false)),
      )
      .subscribe({
        next: ({ officer, roles }) => {
          this.selected.set(officer);
          this.roleOptions.set(
            roles.filter((role) =>
              FLAG_CAPABILITIES.some((permission) => permission === role.permission),
            ),
          );
          this.selectedRoleIds.set(new Set(officer.roles.map((role) => role.roleId)));
          this.form.reset({
            nameEn: officer.nameEn,
            nameAr: officer.nameAr ?? '',
            email: officer.email,
            phoneNumber: officer.phoneNumber ?? '',
          });
          this.form.enable();
          this.form.controls.userName.disable();
          this.form.controls.password.disable();
          this.form.controls.departmentId.disable();
        },
        error: (error) => {
          this.formError.set(feedbackError(error));
          this.denied.set(error.status === 403);
        },
      });
  }

  close(): void {
    if (this.saving()) return;
    this.detailsRequest?.unsubscribe();
    this.mode.set(null);
  }

  fieldError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  saveProfile(): void {
    const creating = this.mode() === 'create';
    if (this.saving() || !this.can(creating ? 'Create' : 'Update')) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const profile = {
      nameEn: value.nameEn.trim(),
      nameAr: value.nameAr.trim() || null,
      email: value.email.trim(),
      phoneNumber: value.phoneNumber.trim() || null,
    };
    const request = creating
      ? this.api.create({
          ...profile,
          departmentId: this.auth.userType() === 'SuperAdmin' ? value.departmentId : undefined,
          userName: value.userName.trim(),
          password: value.password,
        })
      : this.api.update(this.selected()!.flagOfficerId, profile);
    this.saving.set(true);
    this.formError.set('');
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.createdOfficerId.set(creating ? result.flagOfficerId : '');
          this.mode.set(null);
          this.success.set('flags.saved');
          this.load(creating ? 1 : this.page()?.currentPage);
        },
        error: (error) => this.reportError(error, true),
      });
  }

  toggleRole(id: string, checked: boolean): void {
    this.selectedRoleIds.update((ids) => {
      const next = new Set(ids);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  saveRoles(): void {
    if (this.saving() || !this.selected() || !this.can('AssignRoles')) return;
    const roleIds = this.roleOptions()
      .filter((role) => this.selectedRoleIds().has(role.roleId))
      .map((role) => role.roleId);
    this.saving.set(true);
    this.formError.set('');
    this.api
      .assignRoles(this.selected()!.flagOfficerId, roleIds)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.mode.set(null);
          this.success.set('flags.permissionsSaved');
          this.createdOfficerId.set('');
          this.load(this.page()?.currentPage);
        },
        error: (error) => this.reportError(error, true),
      });
  }

  async setActive(officer: FlagOfficerDetails): Promise<void> {
    if (this.saving() || !this.can(officer.isActive ? 'Deactivate' : 'Restore')) return;
    if (
      officer.isActive &&
      !(await this.confirm.confirm({
        message: this.i18n.translate('flags.deactivateConfirm'),
        confirmText: this.i18n.translate('flags.deactivate'),
        variant: 'danger',
      }))
    )
      return;
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .setActive(officer.flagOfficerId, !officer.isActive)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.success.set('flags.saved');
          this.load(this.page()?.currentPage);
        },
        error: (error) => this.reportError(error),
      });
  }

  resetPassword(value: ResetPasswordModalValue): void {
    const officer = this.resetTarget();
    if (!officer || this.saving() || !this.auth.hasPermission('Users.ResetPassword')) return;
    this.saving.set(true);
    this.resetApi
      .resetPassword(officer.applicationUserId, value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.resetTarget.set(null);
          this.success.set('flags.saved');
        },
        error: (error) => this.reportError(error),
      });
  }
}
