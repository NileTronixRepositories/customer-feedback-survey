import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../../auth/presentation/state/auth.store';
import { AuthService } from '../../auth/data/auth.service';
import { AuthBranchSelectionStorageService } from '../../auth/data/auth-branch-selection-storage.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthSession, Role, UserType } from '../../../shared/models/role.model';
import { OperatorFlagsInputComponent } from './operator-flags-input.component';

describe('Flag permissions and identity', () => {
  it.each([
    ['Operator', 'OPERATOR', ['ResponseFlags.View', 'ResponseFlags.CreateOnSubmit'], false, false],
    ['SuperAdmin', 'SUPER_ADMIN', ['ResponseFlags.View', 'FlagOfficers.ViewAll'], false, true],
    ['DepartmentAdmin', 'DEPARTMENT_ADMIN', ['FlagOfficers.ViewAll'], false, true],
    ['FlagOfficer', 'FLAG_OFFICER', ['ResponseFlags.View'], true, false],
  ] as const)(
    'keeps the %s actor in its own workspace and administrative scope',
    (userType, role, permissions, canView, canManage) => {
      const session: AuthSession = {
        token: 'test',
        userType: userType as UserType,
        roles: [],
        permissions,
        user: { id: 'user', name: 'User', email: 'user@example.com', role: role as Role },
      };
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: {} },
          {
            provide: AuthBranchSelectionStorageService,
            useValue: { get: () => null, clear: vi.fn() },
          },
          {
            provide: TokenStorageService,
            useValue: {
              getSession: () => session,
              setSession: vi.fn(),
              getSessionExpiresAt: () => null,
              clear: vi.fn(),
            },
          },
        ],
      });
      const auth = TestBed.inject(AuthStore);
      expect(auth.canUseResponseFlags()).toBe(canView);
      expect(auth.canManageFlagOfficers()).toBe(canManage);
      if (userType === 'FlagOfficer') {
        expect(auth.redirectPath()).toBe('/feedback');
        expect(auth.canAccessSurveyDashboard()).toBe(false);
        expect(auth.canUseResponseFlags('ResponseFlags.Answer')).toBe(false);
      }
    },
  );

  it('restores a FlagOfficer session without falling back to Operator or losing capability claims', () => {
    TestBed.configureTestingModule({});
    const storage = TestBed.inject(TokenStorageService);
    storage.setSession({
      token: 'test-token',
      userType: 'FlagOfficer',
      roles: ['Flag Officer'],
      permissions: ['ResponseFlags.Answer'],
      user: { id: 'officer', name: 'Officer', email: 'officer@example.com', role: 'FLAG_OFFICER' },
    });
    expect(storage.getSession()).toMatchObject({
      userType: 'FlagOfficer',
      permissions: ['ResponseFlags.Answer'],
      user: { role: 'FLAG_OFFICER' },
    });
    storage.clear();
  });
});

describe('Operator flags input', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [OperatorFlagsInputComponent],
      providers: [provideHttpClient()],
    }),
  );
  it('allows multiple flags of the same type with empty briefs and exposes no Answer field', async () => {
    const fixture = TestBed.createComponent(OperatorFlagsInputComponent);
    const component = fixture.componentInstance;
    component.add();
    component.add();
    const [first, second] = component.flags();
    component.update(first.id, 'type', '1');
    component.update(second.id, 'type', '1');
    await fixture.whenStable();
    expect(component.flags().map((flag) => flag.type)).toEqual(['1', '1']);
    expect(fixture.nativeElement.querySelectorAll('textarea')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('[name="answer"]')).toBeNull();
    component.remove(first.id);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('textarea')).toHaveLength(1);
  });
});
