import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ResponseFlagsService } from './response-flags.service';
import { FlagOfficersService } from './flag-officers.service';
import { OperatorTemplatesService } from '../../operator/workspace/data/operator-templates.service';
import { OperatorsService } from '../../department-admin/operators/data/operators.service';
import { SurveyDashboardService } from '../../reports/survey-dashboard/data/survey-dashboard.service';
import { AuthService } from '../../auth/data/auth.service';
import { BranchSatisfactionReportService } from '../../branch-admin/reports/data/branch-satisfaction-report.service';
import {
  OperatorSurveyFlag,
  ResponseFlagApiDetails,
  operatorFlagsValid,
} from '../../../shared/models/response-flag.model';

const flag: ResponseFlagApiDetails = {
  flagId: 'flag-1',
  responseId: 'response-1',
  type: 'Complaint',
  brief: null,
  answer: null,
  createdBy: { applicationUserId: 'operator', nameEn: 'Operator', nameAr: null },
  createdOnUtc: '2026-11-12T08:00:00Z',
  briefUpdatedBy: null,
  briefUpdatedOnUtc: null,
  answeredBy: null,
  answeredOnUtc: null,
};

describe('Response Flags API contracts', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        OperatorTemplatesService,
        OperatorsService,
        SurveyDashboardService,
        BranchSatisfactionReportService,
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it.each([
    [7, 'FLAG_OFFICER'],
    ['7', 'FLAG_OFFICER'],
    ['FlagOfficer', 'FLAG_OFFICER'],
    ['Operator', 'OPERATOR'],
  ])(
    'recognizes login UserType %s without substituting a capability role for actor identity',
    (userType, role) => {
      TestBed.inject(AuthService)
        .login({ userNameOrEmail: 'qa', password: 'password' })
        .subscribe((result) => {
          expect(result.kind).toBe('authenticated');
          if (result.kind === 'authenticated') {
            expect(result.session.user.role).toBe(role);
            expect(result.session.permissions).toEqual(['ResponseFlags.Answer']);
          }
        });
      TestBed.inject(HttpTestingController)
        .expectOne((request) => request.url.endsWith('/api/auth/login'))
        .flush({
          userType,
          token: 'header.' + btoa(JSON.stringify({ userType, name: 'QA' })) + '.signature',
          roles: ['Flag Officer'],
          permissions: ['ResponseFlags.Answer'],
        });
    },
  );

  it('keeps feedback-only templates and complaint items per 100 responses above 100 without inventing scores', () => {
    TestBed.inject(BranchSatisfactionReportService)
      .getReport({})
      .subscribe((report) => {
        expect(report.byTemplate).toEqual([]);
        expect(report.feedbackByTemplate?.[0]).toMatchObject({
          templateId: 'unscored',
          responsesCount: 2,
          complaintsCount: 3,
        });
        expect(report.overall.hasScoreData).toBe(false);
        expect(report.complaints.percentageOfResponses).toBe(150);
        expect(report.complaints.responsesWithComplaints).toBe(2);
      });
    TestBed.inject(HttpTestingController)
      .expectOne((request) => request.url.endsWith('/api/reports/branch/satisfaction'))
      .flush({
        overall: { hasScoreData: false },
        byTemplate: [],
        feedbackByTemplate: [
          {
            templateId: 'unscored',
            responsesCount: 2,
            complaintsCount: 3,
            suggestionsCount: 1,
            commentsCount: 1,
          },
        ],
        complaints: { count: 3, responsesWithComplaints: 2, percentageOfResponses: 150 },
      });
  });

  it('keeps duplicate types, nullable briefs, dates and media in the existing multipart request, without Answer', () => {
    const flags: readonly OperatorSurveyFlag[] = [
      { type: 1 },
      { type: 1, brief: '   ' },
      { type: 2, brief: ' Booking ' },
    ];
    expect(operatorFlagsValid(flags)).toBe(true);
    const media = new File(['audio'], 'recording.webm', { type: 'audio/webm' });
    TestBed.inject(OperatorTemplatesService)
      .submitResponse(
        'template',
        [{ questionId: 'question', voiceFile: media }],
        [{ customInputId: 'date', value: '2026-11-08' }],
        flags,
      )
      .subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/template/responses'),
    );
    const body = request.request.body as FormData;
    expect(body.get('Flags[0].Type')).toBe('1');
    expect(body.get('Flags[1].Type')).toBe('1');
    expect(body.has('Flags[0].Brief')).toBe(false);
    expect(body.has('Flags[1].Brief')).toBe(false);
    expect(body.get('Flags[2].Brief')).toBe('Booking');
    expect(
      [...body.keys()].some((key) => key.startsWith('Flags[') && key.endsWith('.Answer')),
    ).toBe(false);
    expect(body.get('CustomInputs[0].Value')).toBe('2026-11-08');
    expect(body.get('Answers[0].VoiceFile')).toBeInstanceOf(File);
    request.flush({});
  });

  it('omits the optional Flags collection from ordinary submissions', () => {
    TestBed.inject(OperatorTemplatesService).submitResponse('template', [], []).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/template/responses'),
    );
    expect(
      [...(request.request.body as FormData).keys()].some((key) => key.startsWith('Flags')),
    ).toBe(false);
    request.flush({});
  });

  it('rejects missing and invalid types or a long brief, without requiring an Operator brief', () => {
    expect(operatorFlagsValid([])).toBe(true);
    expect(operatorFlagsValid([{ type: 3, brief: null }])).toBe(true);
    expect(operatorFlagsValid([{ type: '' }])).toBe(false);
    expect(operatorFlagsValid([{ type: 4 }])).toBe(false);
    expect(operatorFlagsValid([{ type: 1, brief: 'x'.repeat(1001) }])).toBe(false);
  });

  it('sends type and unanswered together and never adds a Department or Branch scope to the queue', () => {
    TestBed.inject(ResponseFlagsService)
      .list({
        pageNumber: 2,
        pageSize: 25,
        type: 1,
        answered: false,
        from: '2026-11-01',
        to: '2026-11-12',
        orderSort: 'Oldest',
      })
      .subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/api/response-flags/responses'),
    );
    expect(request.request.params.get('answered')).toBe('false');
    expect(request.request.params.get('type')).toBe('1');
    expect(request.request.params.has('departmentId')).toBe(false);
    expect(request.request.params.has('branchId')).toBe(false);
    request.flush({ currentPage: 2, pageSize: 25, totalItems: 51, data: [] });
  });

  it('reads all flags through the Officer endpoint while reusing the historical survey renderer', () => {
    TestBed.inject(ResponseFlagsService)
      .details('response-1')
      .subscribe((details) => {
        expect(details.flags).toHaveLength(2);
        expect(details.flags[0]).toMatchObject({ type: 1, brief: null });
        expect(details.response.customInputs[0].value).toBe('2026-11-08');
        expect(details.response.historicalSurvey).toEqual({ questions: [] });
      });
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/api/response-flags/responses/response-1'))
      .flush({
        response: {
          historicalSurvey: { questions: [] },
          customInputs: [{ type: 3, dateValue: '2026-11-08' }],
        },
        flags: [flag, { ...flag, flagId: 'flag-2' }],
      });
  });

  it('replaces an answer by flagId independently of the existing null brief', () => {
    TestBed.inject(ResponseFlagsService).answer('flag-1', 'Reviewed').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/api/response-flags/flag-1/answer'),
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ answer: 'Reviewed' });
    request.flush({ flagId: 'flag-1', responseId: 'response-1' });
  });

  it('updates only the brief and fetches audit data from the individual Flag endpoint', () => {
    const api = TestBed.inject(ResponseFlagsService);
    api.editBrief('flag-1', 'Details').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/flag-1/brief'),
    );
    expect(request.request.body).toEqual({ brief: 'Details' });
    request.flush({ flagId: 'flag-1', responseId: 'response-1' });
    api.flag('flag-1').subscribe((result) => expect(result.type).toBe(1));
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/api/response-flags/flag-1'))
      .flush(flag);
  });

  it('creates an additional flag without implicitly including an Answer', () => {
    TestBed.inject(ResponseFlagsService)
      .create('response-1', { type: 3, brief: 'Follow up' })
      .subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/api/response-flags/responses/response-1'),
    );
    expect(request.request.body).toEqual({ type: 3, brief: 'Follow up' });
    request.flush({ flagId: 'flag-2', responseId: 'response-1' });
  });

  it('replaces capability roles through the restricted endpoint, including an empty selection', () => {
    TestBed.inject(FlagOfficersService).assignRoles('officer-1', []).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/api/flag-officers/officer-1/roles'),
    );
    expect(request.request.body).toEqual({ roleIds: [] });
    request.flush([]);
  });

  it('omits a Department override for DepartmentAdmin account creation', () => {
    TestBed.inject(FlagOfficersService)
      .create({
        userName: 'officer',
        password: 'Password123!',
        nameEn: 'Officer',
        nameAr: null,
        email: 'officer@example.com',
        phoneNumber: null,
      })
      .subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/api/flag-officers'),
    );
    expect(request.request.body.departmentId).toBeUndefined();
    request.flush({ flagOfficerId: 'officer-1' });
  });

  it('reads the resulting Operator submission permission from the server', () => {
    TestBed.inject(OperatorsService)
      .setFlagSubmission('operator-1', true)
      .subscribe((enabled) => expect(enabled).toBe(false));
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/api/operators/operator-1/flag-submission'),
    );
    expect(request.request.body).toEqual({ enabled: true });
    request.flush(false);
  });

  it('parses nested complaint pagination and preserves repeated response rows and actual template totals', () => {
    TestBed.inject(SurveyDashboardService)
      .getComplaints({ pageNumber: 2, pageSize: 10 })
      .subscribe((result) => {
        expect(result.totalItems).toBe(40);
        expect(result.currentPage).toBe(2);
        expect(result.page).toHaveLength(2);
        expect(result.page?.[0]).toMatchObject({
          itemKind: 'ResponseFlag',
          questionId: null,
          flagId: 'flag-1',
          brief: null,
        });
        expect(result.templateGroups[0].complaintsCount).toBe(35);
        expect(result.templateGroups[0].responsesWithComplaints).toBe(12);
      });
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/survey-dashboard/complaints'))
      .flush({
        totalComplaints: 40,
        responsesWithComplaints: 14,
        complaintRate: 28,
        page: {
          currentPage: 2,
          pageSize: 10,
          totalItems: 40,
          data: [
            { ...flag, itemKind: 'ResponseFlag' },
            {
              responseId: 'response-1',
              itemKind: 'QuestionAnswer',
              questionId: 'question',
              complaintText: 'Waiting',
            },
          ],
        },
        templateGroups: [
          {
            templateId: 'template',
            totalComplaints: 35,
            responsesWithComplaints: 12,
            complaints: [],
          },
        ],
      });
  });

  it.each(['suggestions', 'comments'] as const)(
    'uses %s filters and server totals for Anonymous-only empty results',
    (kind) => {
      TestBed.inject(SurveyDashboardService)
        .getFeedback(kind, { source: 'Anonymous', pageNumber: 1, pageSize: 10, answered: false })
        .subscribe((result) => {
          expect(result.totalItems).toBe(0);
          expect(result.responsesWithFlags).toBe(0);
        });
      const request = TestBed.inject(HttpTestingController).expectOne((r) =>
        r.url.endsWith(`/survey-dashboard/${kind}`),
      );
      expect(request.request.params.get('source')).toBe('Anonymous');
      expect(request.request.params.get('answered')).toBe('false');
      request.flush({
        totalItems: 0,
        responsesWithFlags: 0,
        page: { currentPage: 1, pageSize: 10, totalItems: 0, data: [] },
      });
    },
  );
});
