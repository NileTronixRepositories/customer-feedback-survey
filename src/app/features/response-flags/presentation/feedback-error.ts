import { HttpErrorResponse } from '@angular/common/http';

export function feedbackError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'flags.loadError';
  if (error.status === 403) return 'flags.forbidden';
  if (error.status === 404) return 'flags.notFound';
  if (error.status === 0) return 'flags.networkError';
  if (error.status === 400 || error.status === 422) {
    const body = error.error;
    if (body && typeof body === 'object') {
      const errors = body.errors;
      if (Array.isArray(errors))
        return (
          errors
            .map((item: { message?: string }) => item.message)
            .filter(Boolean)
            .join('\n') || 'flags.validationError'
        );
      if (errors && typeof errors === 'object') return Object.values(errors).flat().join('\n');
      return body.detail || body.message || 'flags.validationError';
    }
  }
  return 'flags.loadError';
}
