import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '../../shared/models/api.models';
import { ToastService } from '../services/toast.service';
import { SKIP_GLOBAL_ERROR_TOAST } from './request-flags';

function mapMessage(status: number, backendMessage?: string): string {
  if (backendMessage) {
    return backendMessage;
  }

  if (status === 400 || status === 422) {
    return 'Invalid request. Please review the submitted fields.';
  }

  if (status === 401) {
    return 'Authentication required or invalid password.';
  }

  if (status === 404) {
    return 'Resource not found.';
  }

  if (status === 410) {
    return 'Link expired, revoked, or max views reached.';
  }

  if (status >= 500) {
    return 'Unexpected server error. Please try again in a few moments.';
  }

  return 'Request failed.';
}

export const errorNormalizerInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  const skipToast = req.context.get(SKIP_GLOBAL_ERROR_TOAST);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const backend = error.error && typeof error.error === 'object' ? error.error : null;
        const apiError: ApiError = {
          status: error.status,
          message: mapMessage(error.status, backend?.message ?? error.error?.message),
          errorId: backend?.errorId ?? error.headers.get('X-Error-Id') ?? undefined
        };

        if (!skipToast) {
          toastService.show({
            kind: 'error',
            title: `Erro HTTP ${apiError.status || 0}`,
            message: apiError.errorId ? `${apiError.message} (errorId: ${apiError.errorId})` : apiError.message
          });
        }

        return throwError(() => apiError);
      }

      if (!skipToast) {
        toastService.show({
          kind: 'error',
          title: 'Erro inesperado',
          message: 'Falha desconhecida no cliente.'
        });
      }

      return throwError(() => ({ status: 0, message: 'Unknown client error.' } as ApiError));
    })
  );
};
