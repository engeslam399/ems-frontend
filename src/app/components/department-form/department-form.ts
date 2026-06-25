import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './department-form.html',
  styleUrl: './department-form.css'
})
export class DepartmentFormComponent {
  private fb = inject(FormBuilder);
  private deptService = inject(DepartmentService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  deptForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]]
  });

  isSubmitting = false;
  errorMessage: string | null = null;
  fieldErrors: { [key: string]: string } = {};

  onSubmit() {
    if (this.deptForm.invalid) {
      this.deptForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.fieldErrors = {};

    const deptData: Department = this.deptForm.value;

    this.deptService.saveDepartment(deptData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.showSuccess(`Department '${deptData.name}' created successfully.`);
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 400 && err.error?.errors) {
          this.fieldErrors = err.error.errors;
          if (this.fieldErrors['code']) {
            this.deptForm.get('code')?.setErrors({ duplicateCode: this.fieldErrors['code'] });
          }
        } else {
          this.errorMessage = err.error?.message || 'An unexpected error occurred. Please try again.';
        }
      }
    });
  }
}
