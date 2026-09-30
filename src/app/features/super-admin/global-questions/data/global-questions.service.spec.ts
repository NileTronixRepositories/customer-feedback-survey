import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GlobalQuestionsService } from './global-questions.service';

describe('GlobalQuestionsService', () => {
  let service: GlobalQuestionsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GlobalQuestionsService],
    });

    service = TestBed.inject(GlobalQuestionsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads a group from global-questions using the groupId query parameter', () => {
    service
      .listByGroup('group-id', {
        pageNumber: 1,
        pageSize: 10,
        searchText: ' service ',
        groupId: '',
        orderSort: ' createdOnUtc desc ',
        isActive: true,
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) =>
      candidate.url.endsWith('/api/global-questions'),
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('groupId')).toBe('group-id');
    expect(request.request.params.get('pageNumber')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('searchText')).toBe('service');
    expect(request.request.params.get('orderSort')).toBe('createdOnUtc desc');
    expect(request.request.params.get('isActive')).toBe('true');

    request.flush({
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      data: [],
    });
  });
});
