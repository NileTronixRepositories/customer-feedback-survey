import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardDrillDownService } from './dashboard-drill-down.service';

describe('DashboardDrillDownService', () => {
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    router.navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: Router, useValue: router }],
    });
  });

  it('changes pagination without rewriting backend filters or encoded values', () => {
    const service = TestBed.inject(DashboardDrillDownService);
    const original =
      '/api/reports/branch-responses?from=2026-09-01&customInputValue=North%20%26%20East&satisfactionCategory=Unhappy&pageNumber=1&pageSize=10';

    const updated = service.updatePath(original, { pageNumber: 2, pageSize: 25 });

    expect(updated).toBe(
      '/api/reports/branch-responses?from=2026-09-01&customInputValue=North%20%26%20East&satisfactionCategory=Unhappy&pageNumber=2&pageSize=25',
    );
  });

  it('stores the backend path in the frontend drill-down route', () => {
    const service = TestBed.inject(DashboardDrillDownService);
    const navigation = {
      routeType: 'SurveyResponses',
      method: 'GET' as const,
      path: '/api/reports/survey-responses?source=All&scoreCalculationMode=LowestConditionLevel',
    };

    service.open({ title: 'Unhappy responses', navigation });

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard-responses'], {
      queryParams: {
        title: 'Unhappy responses',
        path: navigation.path,
        routeType: navigation.routeType,
      },
    });
  });

  it('rejects external and non-GET navigation', () => {
    const service = TestBed.inject(DashboardDrillDownService);

    expect(
      service.isSupported({ routeType: 'External', method: 'GET', path: 'https://example.com/api' }),
    ).toBe(false);
  });
});
