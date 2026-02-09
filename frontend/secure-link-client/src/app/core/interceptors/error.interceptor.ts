import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AppHttpError {
  status: number;
  message: string;
  errorId?: string;
}

function mapErrorMessage(status: number, rawMessage?: string): string {
  if (status === 401 && rawMessage?.toLowerCase().includes('password required')) return 'Password required';
  if (status === 401 && rawMessage?.toLowerCase().includes('invalid password')) return 'Invalid password';
  if (status === 404) return 'Resource not found';
  if (status === 410) return 'Link expired, revoked, or view limit reached';
  if (status === 422 || status === 400) return 'Invalid request';
  if (status >= 500) return 'Unexpected server error';
  return rawMessage || 'Unexpected error';
}

function extractServerMessage(error: HttpErrorResponse): string | undefined {
  const payload = error.error as { message?: string; error?: string } | string | undefined;
  if (!payload) return undefined;
  if (typeof payload === 'string') return payload;
  return payload.message ?? payload.error;
}

function extractErrorId(error: HttpErrorResponse): string | undefined {
  const fromHeader = error.headers.get('X-Error-Id') ?? error.headers.get('x-error-id');
  if (fromHeader) return fromHeader;

  if (error.error && typeof error.error === 'object') {
    return (error.error as { errorId?: string }).errorId;
  }
  return undefined;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const rawMessage = extractServerMessage(error);
      const appError: AppHttpError = {
        status: error.status,
        message: mapErrorMessage(error.status, rawMessage),
        errorId: extractErrorId(error),
      };
      return throwError(() => appError);
    }),
  );
