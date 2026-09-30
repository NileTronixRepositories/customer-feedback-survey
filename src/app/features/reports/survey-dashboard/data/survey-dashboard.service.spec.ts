import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SurveyDashboardQuestionGroup } from '../domain/survey-dashboard.model';
import { SurveyDashboardService } from './survey-dashboard.service';

describe('SurveyDashboardService', () => {
  let service: SurveyDashboardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SurveyDashboardService],
    });

    service = TestBed.inject(SurveyDashboardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('maps question groups and forwards the complete dashboard filter context', () => {
    let result: readonly SurveyDashboardQuestionGroup[] = [];

    service
      .getQuestionGroups({
        branchId: 'branch-id',
        source: 'Internal',
        templateId: 'template-id',
        from: '2026-09-01T00:00:00.000Z',
        to: '2026-09-30T23:59:59.999Z',
        scoreCalculationMode: 'LowestConditionLevel',
      })
      .subscribe((groups) => (result = groups));

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/reports/survey-dashboard/question-groups'),
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('branchId')).toBe('branch-id');
    expect(request.request.params.get('source')).toBe('Internal');
    expect(request.request.params.get('templateId')).toBe('template-id');
    expect(request.request.params.get('anonymousTemplateId')).toBeNull();
    expect(request.request.params.get('from')).toBe('2026-09-01T00:00:00.000Z');
    expect(request.request.params.get('to')).toBe('2026-09-30T23:59:59.999Z');
    expect(request.request.params.get('scoreCalculationMode')).toBe('LowestConditionLevel');

    request.flush({
      appliedFilters: {
        branchId: 'branch-id',
        source: 'Internal',
        templateId: 'template-id',
      },
      questionGroups: [
        {
          templateId: 'template-id',
          templateKind: 'Authorized',
          templateNameEn: 'Customer Satisfaction',
          templateNameAr: null,
          questionGroupId: 'group-id',
          questionGroupNameEn: 'Appointment scheduling',
          questionGroupNameAr: null,
          questionsCount: 2,
          scorableQuestionsCount: 1,
          totalResponses: 5,
          scoredResponsesCount: 4,
          scoredItemsCount: 4,
          averageScoreValue: 4.25,
          averageScorePercentage: 85,
        },
      ],
    });

    expect(result).toEqual([
      expect.objectContaining({
        templateId: 'template-id',
        questionGroupId: 'group-id',
        averageScoreValue: 4.25,
        averageScorePercentage: 85,
      }),
    ]);
  });

  it('uses anonymousTemplateId without sending templateId', () => {
    service
      .getQuestionGroups({
        anonymousTemplateId: 'anonymous-template-id',
        scoreCalculationMode: 'RootQuestions',
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/reports/survey-dashboard/question-groups'),
    );

    expect(request.request.params.get('anonymousTemplateId')).toBe('anonymous-template-id');
    expect(request.request.params.get('templateId')).toBeNull();
    request.flush({ questionGroups: [] });
  });
});
