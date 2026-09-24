import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

export const branchTemplateReportsAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  return authStore.hasPermission('Reports.ViewBranchReports')
    ? true
    : inject(Router).createUrlTree([authStore.redirectPath()]);
};
