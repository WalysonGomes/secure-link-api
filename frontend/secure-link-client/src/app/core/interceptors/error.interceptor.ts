import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppError } from '../../shared/models/api.models';

const messagesByStatus: Record<number, string> = {
  400: 'Invalid request. Please review the fields and try again.',
  401: 'Unauthorized request.',
  404: 'Resource not found.',
  410: 'Link is expired, revoked, or view limit was reached.',
  422: 'Validation failed. Please review your input.'
};

const getMessage = (error: HttpErrorResponse): string => {
  const payloadMessage = typeof error.error === 'object' ? error.error?.message : null;

  return payloadMessage ?? messagesByStatus[error.status] ?? 'Unexpected server error. Please try again.';
};

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const appError: AppError = {
        status: error.status,
        message: getMessage(error),
        errorId: typeof error.error === 'object' ? error.error?.errorId : undefined
      };

      return throwError(() => appError);
    })
  );
