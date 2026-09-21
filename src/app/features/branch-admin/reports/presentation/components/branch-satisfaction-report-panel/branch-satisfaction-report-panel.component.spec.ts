import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchSatisfactionReportPanelComponent } from './branch-satisfaction-report-panel.component';

describe('BranchSatisfactionReportPanelComponent', () => {
  let fixture: ComponentFixture<BranchSatisfactionReportPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchSatisfactionReportPanelComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchSatisfactionReportPanelComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
