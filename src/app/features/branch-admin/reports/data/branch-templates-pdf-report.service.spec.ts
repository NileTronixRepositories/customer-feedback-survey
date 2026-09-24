import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BranchTemplatesPdfReportService } from './branch-templates-pdf-report.service';

describe('BranchTemplatesPdfReportService', () => {
  let service: BranchTemplatesPdfReportService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BranchTemplatesPdfReportService,
      ],
    });

    service = TestBed.inject(BranchTemplatesPdfReportService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the selected template id when downloading Excel', () => {
    service
      .downloadExcel({
        query: {
          fromDate: '2026-08-25',
          toDate: '2026-09-24',
          templateId: '4580d91b-de1f-464a-a414-3c789a4a9df2',
          templateKind: 'Normal',
        },
        language: 'Arabic',
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/reports/templates/excel'),
    );
    expect(request.request.params.get('TemplateId')).toBe(
      '4580d91b-de1f-464a-a414-3c789a4a9df2',
    );
    expect(request.request.params.get('TemplateKind')).toBe('1');
    expect(request.request.params.has('language')).toBe(false);
    expect(request.request.headers.get('Accept-Language')).toBe('ar');
    request.flush(new Blob(), { headers: { 'X-Excel-File-Name': 'report%20file.xlsx' } });
  });

  it('decodes the PDF file name returned by the API', () => {
    let fileName: string | null = null;
    service
      .downloadPdf({
        query: { fromDate: '2026-09-01', toDate: '2026-09-24' },
        language: 'English',
      })
      .subscribe((file) => (fileName = file.fileName));

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/reports/templates/pdf'),
    );
    request.flush(new Blob(), { headers: { 'X-Pdf-File-Name': 'branch%20report.pdf' } });
    expect(fileName).toBe('branch report.pdf');
  });
});
