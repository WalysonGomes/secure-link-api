import { HttpInterceptorFn } from '@angular/common/http';

function createCorrelationId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const request = req.clone({
    setHeaders: {
      'X-Correlation-Id': createCorrelationId()
    }
  });

  return next(request);
};
