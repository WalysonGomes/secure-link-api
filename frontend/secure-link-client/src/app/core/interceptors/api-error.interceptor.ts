import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '../../models/api-error.models';

function extractMessage(error: HttpErrorResponse): string {
  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  if (error.error?.message) {
    return error.error.message;
  }

  switch (error.status) {
    case 400:
    case 422:
      return 'Invalid request. Please review the input and try again.';
    case 401:
      return 'Password required or invalid password.';
    case 404:
      return 'Resource not found.';
    case 410:
      return 'Link expired, revoked or reached max views.';
    case 0:
      return 'Network error while contacting API.';
    default:
      return 'Unexpected server error.';
  }
}

function extractErrorId(error: HttpErrorResponse): string | undefined {
  return error.error?.errorId ?? error.headers.get('X-Error-Id') ?? undefined;
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const normalized: ApiError = {
        status: error.status,
        message: extractMessage(error),
        errorId: extractErrorId(error)
      };

      return throwError(() => normalized);
    })
  );
