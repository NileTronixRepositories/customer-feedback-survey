import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchUsersPageComponent } from './branch-users-page.component';

describe('BranchUsersPageComponent', () => {
  let fixture: ComponentFixture<BranchUsersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchUsersPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchUsersPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
