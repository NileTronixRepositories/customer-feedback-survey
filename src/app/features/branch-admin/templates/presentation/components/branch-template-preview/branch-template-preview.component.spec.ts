import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchTemplatePreviewComponent } from './branch-template-preview.component';

describe('BranchTemplatePreviewComponent', () => {
  let fixture: ComponentFixture<BranchTemplatePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchTemplatePreviewComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchTemplatePreviewComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
