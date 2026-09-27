import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OperatorsService } from './operators.service';

describe('OperatorsService', () => {
  let service: OperatorsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), OperatorsService],
    });

    service = TestBed.inject(OperatorsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('uses the requested inactive state when deactivate returns no body', () => {
    let result: { operatorId: string; isActive: boolean } | undefined;

    service.deactivate('operator-1').subscribe((stateChange) => {
      result = stateChange;
    });

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/operators/operator-1/deactivate'),
    );
    expect(request.request.method).toBe('PUT');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(result).toMatchObject({ operatorId: 'operator-1', isActive: false });
  });

  it('uses the requested active state when restore returns no body', () => {
    let result: { operatorId: string; isActive: boolean } | undefined;

    service.restore('operator-1').subscribe((stateChange) => {
      result = stateChange;
    });

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/operators/operator-1/restore'),
    );
    expect(request.request.method).toBe('PUT');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(result).toMatchObject({ operatorId: 'operator-1', isActive: true });
  });
});
