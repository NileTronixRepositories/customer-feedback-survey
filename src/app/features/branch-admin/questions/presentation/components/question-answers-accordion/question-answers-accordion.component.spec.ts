import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { QuestionAnswersAccordionComponent } from './question-answers-accordion.component';

describe('QuestionAnswersAccordionComponent', () => {
  let fixture: ComponentFixture<QuestionAnswersAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionAnswersAccordionComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionAnswersAccordionComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
