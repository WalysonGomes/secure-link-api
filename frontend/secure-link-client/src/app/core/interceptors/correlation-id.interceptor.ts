import { HttpInterceptorFn } from '@angular/common/http';

const correlationHeader = 'X-Correlation-Id';

function createCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has(correlationHeader)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { [correlationHeader]: createCorrelationId() } }));
};
