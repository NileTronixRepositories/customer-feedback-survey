import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchTemplateResponsesPageComponent } from './branch-template-responses-page.component';

describe('BranchTemplateResponsesPageComponent', () => {
  let fixture: ComponentFixture<BranchTemplateResponsesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchTemplateResponsesPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchTemplateResponsesPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
