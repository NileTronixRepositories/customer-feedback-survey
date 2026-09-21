import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AnonymousTemplateResponsesPageComponent } from './anonymous-template-responses-page.component';

describe('AnonymousTemplateResponsesPageComponent', () => {
  let fixture: ComponentFixture<AnonymousTemplateResponsesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousTemplateResponsesPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousTemplateResponsesPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
