import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthStore } from '../auth/presentation/state/auth.store';

const officerWorkspaceGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return (
    auth.canUseResponseFlags() ||
    inject(Router).createUrlTree([
      auth.userType() === 'FlagOfficer' ? '/feedback/no-access' : auth.redirectPath(),
    ])
  );
};
const managementGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.canManageFlagOfficers() || inject(Router).createUrlTree([auth.redirectPath()]);
};
export const FLAG_OFFICERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [managementGuard],
    loadComponent: () =>
      import('./presentation/flag-officers-page.component').then(
        (m) => m.FlagOfficersPageComponent,
      ),
  },
];
export const RESPONSE_FLAGS_ROUTES: Routes = [
  {
    path: 'no-access',
    loadComponent: () =>
      import('./presentation/feedback-access-page.component').then(
        (m) => m.FeedbackAccessPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [officerWorkspaceGuard],
    loadComponent: () =>
      import('./presentation/flagged-responses-page.component').then(
        (m) => m.FlaggedResponsesPageComponent,
      ),
  },
  {
    path: ':responseId',
    canActivate: [officerWorkspaceGuard],
    loadComponent: () =>
      import('./presentation/flagged-response-page.component').then(
        (m) => m.FlaggedResponsePageComponent,
      ),
  },
];
