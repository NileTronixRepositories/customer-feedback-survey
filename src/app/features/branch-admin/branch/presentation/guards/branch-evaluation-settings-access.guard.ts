import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

export const branchEvaluationSettingsAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.hasPermission('Branches.ViewEvaluationSettings') || authStore.role() === 'BRANCH_ADMIN') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
