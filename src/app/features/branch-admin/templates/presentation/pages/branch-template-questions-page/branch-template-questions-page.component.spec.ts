import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchTemplateQuestionsPageComponent } from './branch-template-questions-page.component';

describe('BranchTemplateQuestionsPageComponent', () => {
  let fixture: ComponentFixture<BranchTemplateQuestionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchTemplateQuestionsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchTemplateQuestionsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
