import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateBranchAdminModalComponent } from './create-branch-admin-modal.component';

describe('CreateBranchAdminModalComponent', () => {
  let fixture: ComponentFixture<CreateBranchAdminModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBranchAdminModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBranchAdminModalComponent);
  });

  it('uses the selected branch when submitting from branch details', async () => {
    fixture.componentRef.setInput('selectedBranch', {
      id: 'branch-1',
      nameEn: 'Main Branch',
      nameAr: 'الفرع الرئيسي',
      code: '001',
    });
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({
      nameEn: 'Branch Admin',
      nameAr: 'مدير الفرع',
      userName: 'branch.admin',
      email: 'admin@example.com',
      phoneNumber: '01000000000',
      password: '123456',
    });

    fixture.componentInstance.submit();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1' }),
    );
  });
});
