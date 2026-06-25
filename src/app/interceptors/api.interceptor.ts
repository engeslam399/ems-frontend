import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_URL } from '../tokens';
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

  const startedAt = Date.now();
  console.debug('[EMS API] Request', {
    method: clone.method,
    url: clone.urlWithParams
  });

  return next(clone).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        console.debug('[EMS API] Response', {
          method: clone.method,
          url: clone.urlWithParams,
          status: event.status,
          durationMs: Date.now() - startedAt
        });
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('[EMS API] Error', {
        method: clone.method,
        url: clone.urlWithParams,
        status: error.status,
        message: error.message,
        body: error.error
      });

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
