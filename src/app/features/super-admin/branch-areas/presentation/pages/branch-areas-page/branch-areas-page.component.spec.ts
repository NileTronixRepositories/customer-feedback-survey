import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BranchAreasPageComponent } from './branch-areas-page.component';

describe('BranchAreasPageComponent', () => {
  let fixture: ComponentFixture<BranchAreasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchAreasPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchAreasPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
