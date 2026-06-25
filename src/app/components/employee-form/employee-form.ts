import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { EmployeeRequest } from '../../models/employee.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css'
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);


  employeeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    dateOfBirth: [''],
    address: ['', [Validators.maxLength(255)]],
    mobile: ['', [Validators.maxLength(20)]],
    salary: ['', [Validators.required, Validators.min(0)]],
    departmentId: ['', [Validators.required]]
  });

  isEditMode = false;
  employeeId: number | null = null;
  departments: Department[] = [];
  
  // Image handling
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  hasExistingImage = false;
  existingImageUrl: string | null = null;
  
  // Status flags
  isSubmitting = false;
  isLoading = false;
  errorMessage: string | null = null;
  fieldErrors: { [key: string]: string } = {};

  ngOnInit() {
    this.loadDepartments();
    
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.isEditMode = true;
        this.employeeId = +idStr;
        this.loadEmployee(this.employeeId);
      }
    });
  }

  loadDepartments() {
    this.departmentService.listDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Failed to load departments. Please reload the page.';
        this.cdr.markForCheck();
      }
    });
  }

  loadEmployee(id: number) {
    this.isLoading = true;
    this.employeeService.getEmployee(id).subscribe({
      next: (emp) => {
        this.isLoading = false;
        
        // Patch values to form
        this.employeeForm.patchValue({
          code: emp.code,
          name: emp.name,
          dateOfBirth: emp.dateOfBirth || '',
          address: emp.address || '',
          mobile: emp.mobile || '',
          salary: emp.salary,
          departmentId: emp.department?.id || ''
        });

        // Set image state
        this.hasExistingImage = emp.hasImage;
        if (emp.hasImage) {
          // Append cache buster to ensure the browser doesn't load a cached image
          this.existingImageUrl = `${this.employeeService.getEmployeeImageUrl(id)}?t=${new Date().getTime()}`;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.status === 404 ? 'Employee not found.' : 'Failed to load employee details.';
        this.cdr.markForCheck();
      }
    });
  }

  // File selection / drag & drop handlers
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    // Validate image format
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, JPEG).';
      return;
    }
    
    // Validate size (max 5MB just as a frontend safety check)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 5MB.';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = null;

    // Show thumbnail preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedImage() {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    
    // If they click cancel/remove on an existing image, reset file input
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeExistingImage() {
    this.hasExistingImage = false;
    this.existingImageUrl = null;
    // We will pass empty/null image, but backend retains existing if nothing new is uploaded,
    // unless we have an option. Here we let them override it.
  }

  onSubmit() {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.fieldErrors = {};

    const formVal = this.employeeForm.value;
    const empData: EmployeeRequest = {
      code: formVal.code,
      name: formVal.name,
      dateOfBirth: formVal.dateOfBirth || undefined,
      address: formVal.address || undefined,
      mobile: formVal.mobile || undefined,
      salary: parseFloat(formVal.salary),
      departmentId: +formVal.departmentId
    };

    const action$ = this.isEditMode && this.employeeId
      ? this.employeeService.updateEmployee(this.employeeId, empData, this.selectedFile)
      : this.employeeService.saveEmployee(empData, this.selectedFile);

    action$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.showSuccess(
          this.isEditMode
            ? `Employee '${empData.name}' updated successfully.`
            : `Employee '${empData.name}' registered successfully.`
        );
        this.router.navigate(['/employees']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 400 && err.error?.errors) {
          this.fieldErrors = err.error.errors;
          if (this.fieldErrors['code']) {
            this.employeeForm.get('code')?.setErrors({ duplicateCode: this.fieldErrors['code'] });
          }
        } else {
          this.errorMessage = err.error?.message || 'An unexpected error occurred. Please try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  onDelete() {
    if (!this.isEditMode || !this.employeeId) return;

    if (confirm(`Are you sure you want to delete employee '${this.employeeForm.get('name')?.value}'?`)) {
      this.isLoading = true;
      this.employeeService.deleteEmployee(this.employeeId).subscribe({
        next: () => {
          this.isLoading = false;
          this.notificationService.showSuccess(`Employee '${this.employeeForm.get('name')?.value}' deleted successfully.`);
          this.router.navigate(['/employees']);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to delete employee.';
          this.cdr.markForCheck();
        }
      });
    }
  }
}
