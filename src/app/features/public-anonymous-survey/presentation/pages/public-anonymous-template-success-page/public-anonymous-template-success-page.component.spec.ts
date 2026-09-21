import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PublicAnonymousTemplateSuccessPageComponent } from './public-anonymous-template-success-page.component';

describe('PublicAnonymousTemplateSuccessPageComponent', () => {
  let fixture: ComponentFixture<PublicAnonymousTemplateSuccessPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicAnonymousTemplateSuccessPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicAnonymousTemplateSuccessPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
