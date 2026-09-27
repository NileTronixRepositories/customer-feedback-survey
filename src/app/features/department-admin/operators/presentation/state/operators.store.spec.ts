import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserPasswordResetService } from '../../../../auth/data/user-password-reset.service';
import { OperatorsService } from '../../data/operators.service';
import { OperatorListItem } from '../../domain/operator.model';
import { OperatorsStore } from './operators.store';

describe('OperatorsStore', () => {
  const operator: OperatorListItem = {
    operatorId: 'operator-1',
    applicationUserId: 'user-1',
    departmentId: 'department-1',
    departmentNameEn: 'Support',
    departmentNameAr: 'الدعم',
    nameEn: 'Operator',
    nameAr: 'مشغل',
    userName: 'operator',
    email: 'operator@example.com',
    phoneNumber: '',
    isActive: true,
    createdBy: null,
    createdOnUtc: '2026-07-15T00:00:00Z',
  };

  function setup(isActive: boolean) {
    const operatorsService = {
      list: vi.fn().mockReturnValue(
        of({
          currentPage: 1,
          pageSize: 10,
          totalItems: 1,
          data: [{ ...operator, isActive }],
        }),
      ),
      deactivate: vi.fn(),
      restore: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OperatorsStore,
        { provide: OperatorsService, useValue: operatorsService },
        { provide: UserPasswordResetService, useValue: {} },
      ],
    });

    const store = TestBed.inject(OperatorsStore);
    store.load();
    return { store, operatorsService };
  }

  it('synchronizes an operator to inactive when deactivate returns AlreadyInactive', () => {
    const { store, operatorsService } = setup(true);
    const completed = vi.fn();
    operatorsService.deactivate.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              errors: [
                {
                  code: 'Operators.Deactivate.AlreadyInactive',
                  message: 'المشغل غير مفعل بالفعل.',
                },
              ],
            },
          }),
      ),
    );

    store.deactivateOperator(operator.operatorId, completed);

    expect(store.operators()[0].isActive).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.success()).toBe('operators.alreadyInactiveSynced');
    expect(completed).toHaveBeenCalledOnce();
  });

  it('synchronizes an operator to active when restore returns AlreadyActive', () => {
    const { store, operatorsService } = setup(false);
    const completed = vi.fn();
    operatorsService.restore.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              errors: [{ code: 'Operators.Restore.AlreadyActive' }],
            },
          }),
      ),
    );

    store.restoreOperator(operator.operatorId, completed);

    expect(store.operators()[0].isActive).toBe(true);
    expect(store.error()).toBeNull();
    expect(store.success()).toBe('operators.alreadyActiveSynced');
    expect(completed).toHaveBeenCalledOnce();
  });
});
