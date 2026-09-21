import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { SurveyTemplateDetailsModalComponent } from './survey-template-details-modal.component';

describe('SurveyTemplateDetailsModalComponent', () => {
  let fixture: ComponentFixture<SurveyTemplateDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyTemplateDetailsModalComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyTemplateDetailsModalComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
