import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PublicSurveyFooterComponent } from './public-survey-footer.component';

describe('PublicSurveyFooterComponent', () => {
  let fixture: ComponentFixture<PublicSurveyFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicSurveyFooterComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicSurveyFooterComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
