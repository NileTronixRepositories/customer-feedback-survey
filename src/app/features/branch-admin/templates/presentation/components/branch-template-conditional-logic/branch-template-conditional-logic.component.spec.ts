import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchTemplateConditionalLogicComponent } from './branch-template-conditional-logic.component';

describe('BranchTemplateConditionalLogicComponent', () => {
  let fixture: ComponentFixture<BranchTemplateConditionalLogicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchTemplateConditionalLogicComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchTemplateConditionalLogicComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
