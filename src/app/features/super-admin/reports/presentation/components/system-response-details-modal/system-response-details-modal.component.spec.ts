import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { SystemResponseDetailsModalComponent } from './system-response-details-modal.component';

describe('SystemResponseDetailsModalComponent', () => {
  let fixture: ComponentFixture<SystemResponseDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemResponseDetailsModalComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SystemResponseDetailsModalComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
