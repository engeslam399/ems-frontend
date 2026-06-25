import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_URL } from '../app.config';
import { NotificationService } from '../services/notification.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = inject(API_URL);
  const notificationService = inject(NotificationService);

  let clone = req;

  // Prefix relative URLs (e.g. "/employees") with the API_URL
  if (req.url.startsWith('/')) {
    clone = req.clone({
      url: `${apiUrl}${req.url}`
    });
  }

  return next(clone).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle server connection failure
      if (error.status === 0) {
        notificationService.showError('Unable to connect to the backend server. Please verify it is running on port 8080.');
      } 
      // Handle unexpected database/server internal crashes
      else if (error.status >= 500) {
        notificationService.showError(error.error?.message || 'A critical server error occurred. Please check system logs.');
      }

      // Propagate error to components for custom handling (e.g. form validation highlights)
      return throwError(() => error);
    })
  );
};
