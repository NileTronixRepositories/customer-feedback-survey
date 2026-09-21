import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PublicAnonymousTemplatePageComponent } from './public-anonymous-template-page.component';

describe('PublicAnonymousTemplatePageComponent', () => {
  let fixture: ComponentFixture<PublicAnonymousTemplatePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicAnonymousTemplatePageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicAnonymousTemplatePageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
