import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { GlobalQuestionCreatePageComponent } from './global-question-create-page.component';

describe('GlobalQuestionCreatePageComponent', () => {
  let fixture: ComponentFixture<GlobalQuestionCreatePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalQuestionCreatePageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalQuestionCreatePageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
