import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { OperatorMyTemplatesPageComponent } from './operator-my-templates-page.component';

describe('OperatorMyTemplatesPageComponent', () => {
  let fixture: ComponentFixture<OperatorMyTemplatesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorMyTemplatesPageComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorMyTemplatesPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
