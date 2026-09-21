import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { SystemResponsesHistoryPageComponent } from './system-responses-history-page.component';

describe('SystemResponsesHistoryPageComponent', () => {
  let fixture: ComponentFixture<SystemResponsesHistoryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemResponsesHistoryPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SystemResponsesHistoryPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
