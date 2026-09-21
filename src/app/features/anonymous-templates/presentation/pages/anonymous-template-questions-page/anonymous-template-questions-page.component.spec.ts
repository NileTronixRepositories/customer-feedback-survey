import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AnonymousTemplateQuestionsPageComponent } from './anonymous-template-questions-page.component';

describe('AnonymousTemplateQuestionsPageComponent', () => {
  let fixture: ComponentFixture<AnonymousTemplateQuestionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousTemplateQuestionsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousTemplateQuestionsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
