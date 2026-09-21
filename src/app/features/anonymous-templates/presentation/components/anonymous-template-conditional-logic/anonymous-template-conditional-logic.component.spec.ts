import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AnonymousTemplateConditionalLogicComponent } from './anonymous-template-conditional-logic.component';

describe('AnonymousTemplateConditionalLogicComponent', () => {
  let fixture: ComponentFixture<AnonymousTemplateConditionalLogicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousTemplateConditionalLogicComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousTemplateConditionalLogicComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
