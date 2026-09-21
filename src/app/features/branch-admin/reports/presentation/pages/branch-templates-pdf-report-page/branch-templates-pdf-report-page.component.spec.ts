import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchTemplatesPdfReportPageComponent } from './branch-templates-pdf-report-page.component';

describe('BranchTemplatesPdfReportPageComponent', () => {
  let fixture: ComponentFixture<BranchTemplatesPdfReportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchTemplatesPdfReportPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchTemplatesPdfReportPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
