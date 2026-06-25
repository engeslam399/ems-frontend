import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeRequest, EmployeeResponse } from '../models/employee.model';
import { API_URL } from '../tokens';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private rawApiUrl = inject(API_URL);
  private apiUrl = '/employees';


  listEmployees(
    searchTerm?: string,
    departmentId?: number,
    minSalary?: number,
    maxSalary?: number
  ): Observable<EmployeeResponse[]> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (departmentId !== undefined && departmentId !== null) {
      params = params.set('departmentId', departmentId.toString());
    }
    if (minSalary !== undefined && minSalary !== null) {
      params = params.set('minSalary', minSalary.toString());
    }
    if (maxSalary !== undefined && maxSalary !== null) {
      params = params.set('maxSalary', maxSalary.toString());
    }
    return this.http.get<EmployeeResponse[]>(this.apiUrl, { params });
  }

  getEmployee(id: number): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/${id}`);
  }

  saveEmployee(employee: EmployeeRequest, imageFile?: File | null): Observable<EmployeeResponse> {
    const formData = this.buildFormData(employee, imageFile);
    return this.http.post<EmployeeResponse>(this.apiUrl, formData);
  }

  updateEmployee(id: number, employee: EmployeeRequest, imageFile?: File | null): Observable<EmployeeResponse> {
    const formData = this.buildFormData(employee, imageFile);
    return this.http.put<EmployeeResponse>(`${this.apiUrl}/${id}`, formData);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEmployeeImageUrl(id: number): string {
    return `${this.rawApiUrl}${this.apiUrl}/${id}/image`;
  }

  private buildFormData(employee: EmployeeRequest, imageFile?: File | null): FormData {
    const formData = new FormData();
    formData.append('code', employee.code);
    formData.append('name', employee.name);
    
    if (employee.dateOfBirth) {
      formData.append('dateOfBirth', employee.dateOfBirth);
    }
    if (employee.address) {
      formData.append('address', employee.address);
    }
    if (employee.mobile) {
      formData.append('mobile', employee.mobile);
    }
    
    formData.append('salary', employee.salary.toString());
    formData.append('departmentId', employee.departmentId.toString());

    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    return formData;
  }
}
