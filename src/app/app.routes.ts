import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'employees',
    loadComponent: () => import('./components/employee-list/employee-list').then(m => m.EmployeeListComponent)
  },
  {
    path: 'employees/new',
    loadComponent: () => import('./components/employee-form/employee-form').then(m => m.EmployeeFormComponent)
  },
  {
    path: 'employees/edit/:id',
    loadComponent: () => import('./components/employee-form/employee-form').then(m => m.EmployeeFormComponent)
  },
  {
    path: 'departments/new',
    loadComponent: () => import('./components/department-form/department-form').then(m => m.DepartmentFormComponent)
  },
  {
    path: '',
    redirectTo: 'employees',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'employees'
  }
];

