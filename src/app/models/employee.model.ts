import { Department } from './department.model';

export interface EmployeeRequest {
  code: string;
  name: string;
  dateOfBirth?: string; // Format: yyyy-MM-dd
  address?: string;
  mobile?: string;
  salary: number;
  departmentId: number;
}

export interface EmployeeResponse {
  id: number;
  code: string;
  name: string;
  dateOfBirth?: string; // Format: yyyy-MM-dd
  address?: string;
  mobile?: string;
  salary: number;
  department: Department;
  hasImage: boolean;
}
