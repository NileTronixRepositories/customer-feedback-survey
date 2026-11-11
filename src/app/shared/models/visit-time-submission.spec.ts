import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorTemplatesService } from '../../features/operator/workspace/data/operator-templates.service';
import { PublicAnonymousTemplateService } from '../../features/public-anonymous-survey/data/public-anonymous-template.service';

describe('Visit Time submission contracts', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OperatorTemplatesService,
        PublicAnonymousTemplateService,
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sends operator dates through Value and reads the returned DateValue', () => {
    let returnedDate: string | null | undefined;
    TestBed.inject(OperatorTemplatesService)
      .submitResponse('template', [], [{ customInputId: 'visit', value: '2026-11-08' }])
      .subscribe((response) => (returnedDate = response.customInputs[0].dateValue));
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/template/responses'),
    );
    const body = request.request.body as FormData;
    expect(body.get('CustomInputs[0].CustomInputId')).toBe('visit');
    expect(body.get('CustomInputs[0].Value')).toBe('2026-11-08');
    expect(body.has('CustomInputs[0].DateValue')).toBe(false);
    request.flush({ customInputs: [{ customInputId: 'visit', type: 3, dateValue: '2026-11-08' }] });
    expect(returnedDate).toBe('2026-11-08');
  });

  it('sends anonymous dates exclusively through DateValue', () => {
    TestBed.inject(PublicAnonymousTemplateService)
      .submitResponse('template', {
        customInputValues: [
          {
            customInputId: 'visit',
            stringValue: null,
            integerValue: null,
            dateValue: '2026-11-08',
          },
        ],
        answers: [],
      })
      .subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) =>
      r.url.endsWith('/template/responses'),
    );
    const body = request.request.body as FormData;
    expect(body.get('CustomInputValues[0].CustomInputId')).toBe('visit');
    expect(body.get('CustomInputValues[0].DateValue')).toBe('2026-11-08');
    expect(body.has('CustomInputValues[0].StringValue')).toBe(false);
    expect(body.has('CustomInputValues[0].IntegerValue')).toBe(false);
    request.flush({});
  });

  it('keeps a system visit date optional while reading its identity', () => {
    TestBed.inject(PublicAnonymousTemplateService)
      .getTemplate('template')
      .subscribe((template) => {
        expect(template.customInputs[0]).toMatchObject({
          type: 3,
          isRequired: false,
          isSystemField: true,
          systemFieldKey: 'VisitTime',
        });
      });
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/template'))
      .flush({
        customInputs: [
          {
            customInputId: 'visit',
            type: 'Date',
            isSystemField: true,
            systemFieldKey: 'VisitTime',
            isRequired: true,
          },
        ],
      });
  });
});
