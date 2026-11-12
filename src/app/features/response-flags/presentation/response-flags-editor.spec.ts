import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../../auth/presentation/state/auth.store';
import { ResponseFlagsService } from '../data/response-flags.service';
import { FlagOfficersService } from '../data/flag-officers.service';
import { ResponseFlagDetails } from '../../../shared/models/response-flag.model';
import { FlaggedResponsePageComponent } from './flagged-response-page.component';
import { FlagOfficersPageComponent } from './flag-officers-page.component';
import { DashboardDrillDownService } from '../../reports/dashboard-drill-down/data/dashboard-drill-down.service';

describe('Feedback editor regressions', () => {
  it('answers a null-Brief Flag through the rendered form without imposing Brief validation', async () => {
    const flag: ResponseFlagDetails = {
      flagId: 'flag',
      responseId: 'response',
      type: 1,
      brief: null,
      answer: null,
      createdBy: { applicationUserId: 'user', nameEn: 'Operator', nameAr: null },
      createdOnUtc: '2026-11-12T08:00:00Z',
      briefUpdatedBy: null,
      briefUpdatedOnUtc: null,
      answeredBy: null,
      answeredOnUtc: null,
    };
    const api = {
      details: vi.fn().mockReturnValue(of({ response: {}, flags: [flag] })),
      answer: vi.fn().mockReturnValue(of({ flagId: 'flag', responseId: 'response' })),
      flag: vi.fn().mockReturnValue(of({ ...flag, answer: 'Reviewed' })),
    };
    TestBed.configureTestingModule({
      imports: [FlaggedResponsePageComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ responseId: 'response' }), queryParams: {} },
          },
        },
        { provide: AuthStore, useValue: { canUseResponseFlags: () => true } },
        { provide: ResponseFlagsService, useValue: api },
      ],
    });
    api.details.mockReturnValue(
      of({
        response: TestBed.inject(DashboardDrillDownService).mapResponseDetails({}),
        flags: [flag],
      }),
    );
    const fixture = TestBed.createComponent(FlaggedResponsePageComponent);
    await fixture.whenStable();
    fixture.componentInstance.openEditor('answer', flag);
    await fixture.whenStable();
    fixture.componentInstance.form.controls.answer.setValue('Reviewed');
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('app-modal form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(api.answer).toHaveBeenCalledWith('flag', 'Reviewed');
    expect(fixture.componentInstance.data()?.flags[0].brief).toBeNull();
    expect(fixture.componentInstance.data()?.flags[0].answer).toBe('Reviewed');
  });

  it('submits the actual selected role IDs from the native permissions form', async () => {
    const roles = [
      { roleId: 'view', name: 'View', permission: 'ResponseFlags.View' },
      { roleId: 'answer', name: 'Answer', permission: 'ResponseFlags.Answer' },
    ];
    const api = {
      list: vi.fn().mockReturnValue(of({ currentPage: 1, pageSize: 10, totalItems: 0, data: [] })),
      details: vi
        .fn()
        .mockReturnValue(
          of({
            flagOfficerId: 'officer',
            nameEn: 'Officer',
            email: 'officer@example.com',
            roles: [roles[0]],
          }),
        ),
      roles: vi.fn().mockReturnValue(of(roles)),
      assignRoles: vi.fn().mockReturnValue(of(roles)),
    };
    TestBed.configureTestingModule({
      imports: [FlagOfficersPageComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            userType: () => 'DepartmentAdmin',
            canManageFlagOfficers: () => true,
            hasPermission: () => false,
          },
        },
        { provide: FlagOfficersService, useValue: api },
      ],
    });
    const fixture = TestBed.createComponent(FlagOfficersPageComponent);
    await fixture.whenStable();
    fixture.componentInstance.open('officer', 'roles');
    await fixture.whenStable();
    fixture.componentInstance.toggleRole('answer', true);
    const form = fixture.nativeElement.querySelector('app-modal form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(api.assignRoles).toHaveBeenCalledWith('officer', ['view', 'answer']);
  });
});
