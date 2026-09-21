import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { OperatorsPageComponent } from './operators-page.component';

describe('OperatorsPageComponent', () => {
  let fixture: ComponentFixture<OperatorsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
