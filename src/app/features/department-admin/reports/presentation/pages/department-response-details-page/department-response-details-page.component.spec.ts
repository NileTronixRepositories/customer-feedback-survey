import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { DepartmentResponseDetailsPageComponent } from './department-response-details-page.component';

describe('DepartmentResponseDetailsPageComponent', () => {
  let fixture: ComponentFixture<DepartmentResponseDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentResponseDetailsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentResponseDetailsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
