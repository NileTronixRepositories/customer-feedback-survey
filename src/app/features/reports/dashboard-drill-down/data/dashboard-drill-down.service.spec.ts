import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardDrillDownService } from './dashboard-drill-down.service';

describe('DashboardDrillDownService', () => {
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    router.navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
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

  it('preserves localized option text in response details', async () => {
    const service = TestBed.inject(DashboardDrillDownService);
    const http = TestBed.inject(HttpTestingController);
    const detailsPromise = firstValueFrom(
      service.loadDetails({
        routeType: 'SurveyResponseDetails',
        method: 'GET',
        path: '/api/reports/survey-responses/response-1',
      }),
    );

    http.expectOne((request) => request.url.endsWith('/api/reports/survey-responses/response-1')).flush({
      surveyResponseId: 'response-1',
      answers: [
        {
          questionTextEn: 'How was your visit?',
          questionTextAr: 'كيف كانت زيارتك؟',
          questionTypeName: 'SingleChoice',
          displayValue: 'Very Good',
          selectedOptionTextEn: 'Very Good',
          selectedOptionTextAr: 'جيد جداً',
        },
      ],
    });

    const details = await detailsPromise;

    expect(details.answers[0].selectedOptionTextEn).toBe('Very Good');
    expect(details.answers[0].selectedOptionTextAr).toBe('جيد جداً');
  });
});
