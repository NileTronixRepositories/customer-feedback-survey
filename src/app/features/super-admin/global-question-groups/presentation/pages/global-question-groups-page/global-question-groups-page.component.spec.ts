import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { GlobalQuestionGroupsPageComponent } from './global-question-groups-page.component';

describe('GlobalQuestionGroupsPageComponent', () => {
  let fixture: ComponentFixture<GlobalQuestionGroupsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalQuestionGroupsPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalQuestionGroupsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
