import {
  HttpContextToken,
  HttpErrorResponse,
  HttpResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, of, tap, throwError } from 'rxjs';
import { I18nService } from '../services/i18n.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_SUCCESS_TOAST = new HttpContextToken<boolean>(() => false);

interface ApiProblemDetails {
  title: string;
  detail: string;
  errors: readonly string[];
}

export const errorToastInterceptor: HttpInterceptorFn = (request, next) => {
  const toastService = inject(ToastService);
  const i18n = inject(I18nService);

  return next(request).pipe(
    tap((event) => {
      if (
        event instanceof HttpResponse &&
        isMutationMethod(request.method) &&
        !isAuthRequest(request.url) &&
        !request.context.get(SKIP_SUCCESS_TOAST)
      ) {
        toastService.success(
          i18n.translate('toast.successTitle'),
          i18n.translate('toast.successDescription'),
        );
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !request.context.get(SKIP_ERROR_TOAST)) {
        return resolveProblemDetails(error, i18n).pipe(
          mergeMap((problem) => {
            toastService.error(problem.title, problem.detail || problem.errors.join('\n'));
            return throwError(() => error);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

function isMutationMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function isAuthRequest(url: string): boolean {
  return url.includes('/api/auth/');
}

function resolveProblemDetails(error: HttpErrorResponse, i18n: I18nService) {
  const body = error.error;
  if (body instanceof Blob) {
    return from(readBlobProblemDetails(error, body, i18n));
  }

  return of(readProblemDetails(error, body, i18n));
}

async function readBlobProblemDetails(
  error: HttpErrorResponse,
  blob: Blob,
  i18n: I18nService,
): Promise<ApiProblemDetails> {
  const text = (await blob.text()).trim();
  if (!text) {
    return readProblemDetails(error, {}, i18n);
  }

  return readProblemDetails(error, parseProblemText(text), i18n);
}

function readProblemDetails(
  error: HttpErrorResponse,
  body: unknown,
  i18n: I18nService,
): ApiProblemDetails {
  const problem = isRecord(body) ? body : {};
  const errors = readErrorMessages(problem['errors']);
  const detail =
    readString(problem['detail']) ||
    readString(problem['message']) ||
    (typeof body === 'string' ? body.trim() : '');
  const safeDetail = isHttpClientFailureMessage(detail) ? '' : detail;
  const title = readString(problem['title']) || statusTitle(error.status, i18n);

  return {
    title,
    detail:
      errors.length > 0
        ? errors.slice(0, 3).join('\n')
        : safeDetail || statusDescription(error.status, i18n),
    errors,
  };
}

function parseProblemText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readErrorMessages(errors: unknown): readonly string[] {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map((error) => {
      if (!isRecord(error)) {
        return '';
      }

      return readString(error['message']) || readString(error['code']);
    })
    .filter((message) => message.length > 0);
}

function statusTitle(status: number, i18n: I18nService): string {
  if (status === 0) {
    return i18n.translate('toast.networkErrorTitle');
  }
  if (status === 401) {
    return i18n.translate('toast.unauthorizedTitle');
  }
  if (status === 403) {
    return i18n.translate('toast.forbiddenTitle');
  }
  if (status === 404) {
    return i18n.translate('toast.notFoundTitle');
  }
  if (status === 422 || status === 400) {
    return i18n.translate('toast.validationErrorTitle');
  }

  return i18n.translate('toast.requestFailedTitle');
}

function statusDescription(status: number, i18n: I18nService): string {
  if (status === 0) {
    return i18n.translate('toast.networkErrorDescription');
  }
  if (status === 401) {
    return i18n.translate('toast.unauthorizedDescription');
  }
  if (status === 403) {
    return i18n.translate('toast.forbiddenDescription');
  }
  if (status === 404) {
    return i18n.translate('toast.notFoundDescription');
  }
  if (status === 422 || status === 400) {
    return i18n.translate('toast.validationErrorDescription');
  }

  return i18n.translate('toast.requestFailedDescription');
}

function isHttpClientFailureMessage(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return normalizedValue.includes('http failure response for') || normalizedValue.includes('/api/');
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
