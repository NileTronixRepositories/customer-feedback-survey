import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AnonymousBranchResponsesPageComponent } from './anonymous-branch-responses-page.component';

describe('AnonymousBranchResponsesPageComponent', () => {
  let fixture: ComponentFixture<AnonymousBranchResponsesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousBranchResponsesPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousBranchResponsesPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
