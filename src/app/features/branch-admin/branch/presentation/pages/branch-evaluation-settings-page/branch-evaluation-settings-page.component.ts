import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Percent,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  Sliders,
  Smile,
  Sparkles,
} from 'lucide-angular';
import { I18nService } from '../../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../../shared/ui/icon/icon.component';
import { PageHeaderComponent } from '../../../../../../shared/ui/page-header/page-header.component';
import { AuthStore } from '../../../../../auth/presentation/state/auth.store';
import { BranchAdminBranchStore } from '../../state/branch-admin-branch.store';
import { BranchEvaluationSettingsStore } from '../../state/branch-evaluation-settings.store';
import {
  UpdateBranchEvaluationSettingsRequest,
  validateBranchEvaluationSettings,
} from '../../../domain/branch-evaluation-settings.model';

@Component({
  selector: 'app-branch-evaluation-settings-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    IconComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './branch-evaluation-settings-page.component.html',
  styleUrl: './branch-evaluation-settings-page.component.css',
  providers: [BranchEvaluationSettingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchEvaluationSettingsPageComponent implements OnInit {
  readonly store = inject(BranchEvaluationSettingsStore);
  readonly branchStore = inject(BranchAdminBranchStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  readonly i18n = inject(I18nService);

  readonly slidersIcon = Sliders;
  readonly saveIcon = Save;
  readonly checkCircleIcon = CheckCircle2;
  readonly alertIcon = AlertTriangle;
  readonly alertCircleIcon = AlertCircle;
  readonly percentIcon = Percent;
  readonly shieldIcon = Shield;
  readonly shieldAlertIcon = ShieldAlert;
  readonly sparklesIcon = Sparkles;
  readonly helpIcon = HelpCircle;
  readonly resetIcon = RotateCcw;
  readonly smileIcon = Smile;
  readonly activityIcon = Activity;
  readonly clockIcon = Clock;

  readonly canManage = computed(
    () =>
      this.authStore.hasPermission('Branches.ManageEvaluationSettings') &&
      this.authStore.userType() === 'BranchAdmin',
  );

  readonly branchId = computed(
    () => this.branchStore.branch()?.id || this.authStore.user()?.branchId || '',
  );

  readonly form = this.formBuilder.group({
    neutralMinimum: [60, [Validators.required, Validators.min(0), Validators.max(100)]],
    satisfiedMinimum: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
    mediumRiskMinimum: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
    healthyMinimum: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly satisfactionBreakdown = computed(() => {
    const raw = this.formValues();
    const neutral = Math.max(0, Math.min(100, Number(raw?.neutralMinimum ?? 60)));
    const satisfied = Math.max(0, Math.min(100, Number(raw?.satisfiedMinimum ?? 80)));
    const unhappyWidth = Math.min(neutral, satisfied);
    const neutralWidth = Math.max(0, satisfied - neutral);
    const satisfiedWidth = Math.max(0, 100 - Math.max(neutral, satisfied));
    return {
      unhappyWidth,
      neutralWidth,
      satisfiedWidth,
      neutral,
      satisfied,
    };
  });

  readonly riskBreakdown = computed(() => {
    const raw = this.formValues();
    const mediumRisk = Math.max(0, Math.min(100, Number(raw?.mediumRiskMinimum ?? 50)));
    const healthy = Math.max(0, Math.min(100, Number(raw?.healthyMinimum ?? 75)));
    const highRiskWidth = Math.min(mediumRisk, healthy);
    const mediumRiskWidth = Math.max(0, healthy - mediumRisk);
    const healthyWidth = Math.max(0, 100 - Math.max(mediumRisk, healthy));
    return {
      highRiskWidth,
      mediumRiskWidth,
      healthyWidth,
      mediumRisk,
      healthy,
    };
  });

  readonly validationErrors = computed(() => {
    const raw = this.form.getRawValue();
    const payload: UpdateBranchEvaluationSettingsRequest = {
      neutralMinimum: Number(raw.neutralMinimum ?? 0),
      satisfiedMinimum: Number(raw.satisfiedMinimum ?? 0),
      mediumRiskMinimum: Number(raw.mediumRiskMinimum ?? 0),
      healthyMinimum: Number(raw.healthyMinimum ?? 0),
    };
    const res = validateBranchEvaluationSettings(payload);
    return res.valid ? [] : res.errors;
  });

  readonly isValid = computed(() => this.form.valid && this.validationErrors().length === 0);

  constructor() {
    effect(() => {
      const settings = this.store.settings();
      if (settings) {
        this.form.patchValue(
          {
            neutralMinimum: settings.neutralMinimum,
            satisfiedMinimum: settings.satisfiedMinimum,
            mediumRiskMinimum: settings.mediumRiskMinimum,
            healthyMinimum: settings.healthyMinimum,
          },
          { emitEvent: true },
        );
      }
    });
  }

  ngOnInit(): void {
    const id = this.branchId();
    if (id) {
      this.store.load(id);
    }
  }

  onSubmit(): void {
    if (!this.canManage() || !this.isValid() || this.store.saving()) {
      return;
    }

    const id = this.branchId();
    if (!id) return;

    const raw = this.form.getRawValue();
    const payload: UpdateBranchEvaluationSettingsRequest = {
      neutralMinimum: Number(raw.neutralMinimum),
      satisfiedMinimum: Number(raw.satisfiedMinimum),
      mediumRiskMinimum: Number(raw.mediumRiskMinimum),
      healthyMinimum: Number(raw.healthyMinimum),
    };

    this.store.save(id, payload);
  }

  resetToEffective(): void {
    const settings = this.store.settings();
    if (settings) {
      this.form.patchValue(
        {
          neutralMinimum: settings.neutralMinimum,
          satisfiedMinimum: settings.satisfiedMinimum,
          mediumRiskMinimum: settings.mediumRiskMinimum,
          healthyMinimum: settings.healthyMinimum,
        },
        { emitEvent: true },
      );
      this.store.dismissSuccess();
    }
  }
}
