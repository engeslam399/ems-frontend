import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, merge, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { EmployeeResponse } from '../../models/employee.model';
import { Department } from '../../models/department.model';
import { NotificationService } from '../../services/notification.service';

interface EmployeeFilters {
  searchTerm: string | null;
  departmentId: number | null;
  minSalary: number | null;
  maxSalary: number | null;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  employees: EmployeeResponse[] = [];
  departments: Department[] = [];
  
  // Filter form
  filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    departmentId: [null],
    minSalary: [''],
    maxSalary: ['']
  });

  // Summary Metrics
  totalEmployees = 0;
  averageSalary = 0;
  totalDepartments = 0;

  // Modals & Messages
  showDeleteModal = false;
  employeeToDelete: EmployeeResponse | null = null;
  
  isLoading = false;
  errorMessage: string | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly reloadEmployees$ = new Subject<void>();

  ngOnInit() {
    this.loadDepartments();
    this.setupFilterPipeline();
    this.reloadEmployees$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackDepartmentById(_index: number, dept: Department): number {
    return dept.id!;
  }

  compareDepartmentOption(optionValue: number | null, controlValue: number | null): boolean {
    if (optionValue == null) {
      return controlValue == null;
    }
    if (controlValue == null) {
      return false;
    }
    return Number(optionValue) === Number(controlValue);
  }

  onDepartmentChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedIndex = selectElement.selectedIndex;
    const departmentId = selectedIndex <= 0
      ? null
      : this.departments[selectedIndex - 1]?.id ?? null;

    this.filterForm.get('departmentId')?.setValue(departmentId, { emitEvent: false });
    this.reloadEmployees$.next();
  }

  loadDepartments() {
    this.departmentService.listDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.totalDepartments = departments.length;
        console.debug('[EMS Dashboard] Departments loaded', {
          departments: departments.length
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load dashboard data.';
        console.error('[EMS Dashboard] Failed to load departments', err);
        this.cdr.markForCheck();
      }
    });
  }

  private setupFilterPipeline() {
    merge(
      this.filterForm.get('searchTerm')!.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.filterForm.get('minSalary')!.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ),
      this.filterForm.get('maxSalary')!.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ),
      this.reloadEmployees$
    ).pipe(
      startWith(null),
      switchMap(() => {
        const filters = this.getNormalizedFilters();

        this.isLoading = true;
        this.errorMessage = null;

        console.debug('[EMS Dashboard] Loading employees', filters);

        return this.employeeService.listEmployees(
          filters.searchTerm ?? undefined,
          filters.departmentId ?? undefined,
          filters.minSalary ?? undefined,
          filters.maxSalary ?? undefined
        ).pipe(
          map((employees) => ({ employees, filters })),
          catchError((err) => {
            console.error('[EMS Dashboard] Failed to load employees', err);
            this.errorMessage = 'Failed to retrieve employee records.';
            this.isLoading = false;
            this.cdr.markForCheck();
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((result) => {
      if (!result) {
        return;
      }

      this.isLoading = false;
      this.employees = result.employees;
      this.calculateMetrics(result.employees);
      console.debug('[EMS Dashboard] Employees loaded', {
        employees: result.employees.length,
        departmentId: result.filters.departmentId,
        averageSalary: this.averageSalary
      });
      this.cdr.markForCheck();
    });
  }

  private getNormalizedFilters(): EmployeeFilters {
    const filters = this.filterForm.getRawValue();

    return {
      searchTerm: filters.searchTerm?.trim() || null,
      departmentId: this.toNumberOrNull(filters.departmentId),
      minSalary: this.toNumberOrNull(filters.minSalary),
      maxSalary: this.toNumberOrNull(filters.maxSalary)
    };
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  calculateMetrics(data: EmployeeResponse[]) {
    this.totalEmployees = data.length;
    if (this.totalEmployees > 0) {
      const sum = data.reduce((acc, emp) => acc + emp.salary, 0);
      this.averageSalary = sum / this.totalEmployees;
    } else {
      this.averageSalary = 0;
    }
  }

  clearFilters() {
    console.debug('[EMS Dashboard] Clearing filters');
    this.filterForm.reset({
      searchTerm: '',
      departmentId: null,
      minSalary: '',
      maxSalary: ''
    }, { emitEvent: false });
    this.reloadEmployees$.next();
  }

  // Employee Profile Image URL
  getImageUrl(id: number): string {
    return `${this.employeeService.getEmployeeImageUrl(id)}?t=${new Date().getTime()}`;
  }

  // Fallback Initials Avatar Helpers
  getInitials(name: string): string {
    if (!name) return 'EE';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getAvatarStyle(name: string): string {
    // Generate a consistent gradient color scheme based on the name length / character code
    const gradients = [
      'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
      'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink to Purple
      'linear-gradient(135deg, #f59e0b, #e11d48)', // Amber to Rose
      'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald to Blue
      'linear-gradient(135deg, #84cc16, #06b6d4)'  // Lime to Teal
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    const index = sum % gradients.length;
    return gradients[index];
  }

  // Deletion Modal Trigger
  triggerDelete(employee: EmployeeResponse) {
    this.employeeToDelete = employee;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.employeeToDelete = null;
  }

  confirmDelete() {
    if (!this.employeeToDelete) return;
    
    this.isLoading = true;
    const name = this.employeeToDelete.name;
    
    this.employeeService.deleteEmployee(this.employeeToDelete.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.showDeleteModal = false;
        this.employeeToDelete = null;
        this.notificationService.showSuccess(`Employee '${name}' deleted successfully.`);
        this.reloadEmployees$.next();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.showDeleteModal = false;
        this.employeeToDelete = null;
        this.errorMessage = err.error?.message || 'Failed to delete the employee record.';
        console.error('[EMS Dashboard] Failed to delete employee', err);
        this.cdr.markForCheck();
      }
    });
  }
}
