import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { EmployeeResponse } from '../../models/employee.model';
import { Department } from '../../models/department.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  employees: EmployeeResponse[] = [];
  departments: Department[] = [];
  
  // Filter form
  filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    departmentId: [''],
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

  ngOnInit() {
    this.loadDepartments();
    this.loadEmployees();
    this.setupFilterListeners();
  }

  loadDepartments() {
    this.departmentService.listDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.totalDepartments = data.length;
      },
      error: () => {
        this.errorMessage = 'Failed to load department filters.';
      }
    });
  }

  loadEmployees() {
    this.isLoading = true;
    const filters = this.filterForm.value;
    
    const deptId = filters.departmentId ? +filters.departmentId : undefined;
    const minSal = filters.minSalary !== '' ? +filters.minSalary : undefined;
    const maxSal = filters.maxSalary !== '' ? +filters.maxSalary : undefined;

    this.employeeService.listEmployees(
      filters.searchTerm,
      deptId,
      minSal,
      maxSal
    ).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.employees = data;
        this.calculateMetrics(data);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to retrieve employee records.';
      }
    });
  }

  setupFilterListeners() {
    // Automatically search on term typing after brief debounce
    this.filterForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.loadEmployees());

    // Automatically search on department selection
    this.filterForm.get('departmentId')?.valueChanges.subscribe(() => this.loadEmployees());

    // Search on salary inputs with debounce
    this.filterForm.get('minSalary')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadEmployees());

    this.filterForm.get('maxSalary')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadEmployees());
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
    this.filterForm.reset({
      searchTerm: '',
      departmentId: '',
      minSalary: '',
      maxSalary: ''
    }, { emitEvent: false });
    this.loadEmployees();
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
        this.loadEmployees();
      },
      error: (err) => {
        this.isLoading = false;
        this.showDeleteModal = false;
        this.employeeToDelete = null;
        this.errorMessage = err.error?.message || 'Failed to delete the employee record.';
      }
    });
  }
}
