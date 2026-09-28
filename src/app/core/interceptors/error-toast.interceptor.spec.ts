import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { errorToastInterceptor } from './error-toast.interceptor';

describe('errorToastInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let toastService: ToastService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpTesting.verify());

  it('shows localized Arabic fallback messages', () => {
    localStorage.setItem('cfs_language', 'ar');

    http.get('/api/protected').subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/protected').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(toastService.toasts()[0]).toMatchObject({
      variant: 'error',
      title: 'غير مسموح',
      description: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
    });
  });

  it('shows localized English fallback messages', () => {
    http.get('/api/missing').subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/missing').flush({}, { status: 404, statusText: 'Not Found' });

    expect(toastService.toasts()[0]).toMatchObject({
      variant: 'error',
      title: 'Not found',
      description: 'The requested resource was not found.',
    });
  });
});
