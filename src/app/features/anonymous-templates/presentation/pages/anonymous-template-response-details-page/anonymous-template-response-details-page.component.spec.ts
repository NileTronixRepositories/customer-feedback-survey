import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AnonymousTemplateResponseDetailsPageComponent } from './anonymous-template-response-details-page.component';

describe('AnonymousTemplateResponseDetailsPageComponent', () => {
  let fixture: ComponentFixture<AnonymousTemplateResponseDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousTemplateResponseDetailsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousTemplateResponseDetailsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
