import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { SurveyAnonymousResponseDetailsModalComponent } from './survey-anonymous-response-details-modal.component';

describe('SurveyAnonymousResponseDetailsModalComponent', () => {
  let fixture: ComponentFixture<SurveyAnonymousResponseDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyAnonymousResponseDetailsModalComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyAnonymousResponseDetailsModalComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
