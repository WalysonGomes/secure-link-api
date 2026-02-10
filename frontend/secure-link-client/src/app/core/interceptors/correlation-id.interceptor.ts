import { HttpInterceptorFn } from '@angular/common/http';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const request = req.clone({
    setHeaders: {
      'X-Correlation-Id': generateCorrelationId()
    }
  });

  return next(request);
};
