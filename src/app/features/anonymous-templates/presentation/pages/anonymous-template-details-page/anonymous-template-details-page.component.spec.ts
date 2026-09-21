import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AnonymousTemplateDetailsPageComponent } from './anonymous-template-details-page.component';

describe('AnonymousTemplateDetailsPageComponent', () => {
  let fixture: ComponentFixture<AnonymousTemplateDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousTemplateDetailsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousTemplateDetailsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
