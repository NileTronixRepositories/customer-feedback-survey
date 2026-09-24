import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnonymousTemplatesService } from './anonymous-templates.service';

describe('AnonymousTemplatesService', () => {
  let service: AnonymousTemplatesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AnonymousTemplatesService],
    });

    service = TestBed.inject(AnonymousTemplatesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('assigns a global anonymous template to a branch with multipart data', () => {
    service
      .assignGlobalToBranch('global-template-id', {
        branchId: 'branch-id',
        activeFrom: '2026-09-24T10:00:00.000Z',
        expireTo: '2026-10-24T10:00:00.000Z',
        logo: null,
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith(
        '/api/anonymous-templates/global-template-id/assign-to-branch',
      ),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);

    const body = request.request.body as FormData;
    expect(body.get('BranchId')).toBe('branch-id');
    expect(body.get('ActiveFrom')).toBe('2026-09-24T10:00:00.000Z');
    expect(body.get('ExpireTo')).toBe('2026-10-24T10:00:00.000Z');
    expect(body.has('Logo')).toBe(false);

    request.flush({
      anonymousTemplateId: 'branch-template-id',
      scope: 1,
      branchId: 'branch-id',
    });
  });
});
