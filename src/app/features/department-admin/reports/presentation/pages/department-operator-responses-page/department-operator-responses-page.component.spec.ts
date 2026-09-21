import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { DepartmentOperatorResponsesPageComponent } from './department-operator-responses-page.component';

describe('DepartmentOperatorResponsesPageComponent', () => {
  let fixture: ComponentFixture<DepartmentOperatorResponsesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentOperatorResponsesPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentOperatorResponsesPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
