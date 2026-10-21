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
        return resolveProblemDetails(error, i18n, request.url).pipe(
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

function resolveProblemDetails(error: HttpErrorResponse, i18n: I18nService, url?: string) {
  const body = error.error;
  if (body instanceof Blob) {
    return from(readBlobProblemDetails(error, body, i18n, url));
  }

  return of(readProblemDetails(error, body, i18n, url));
}

async function readBlobProblemDetails(
  error: HttpErrorResponse,
  blob: Blob,
  i18n: I18nService,
  url?: string,
): Promise<ApiProblemDetails> {
  const text = (await blob.text()).trim();
  if (!text) {
    return readProblemDetails(error, {}, i18n, url);
  }

  return readProblemDetails(error, parseProblemText(text), i18n, url);
}

function readProblemDetails(
  error: HttpErrorResponse,
  body: unknown,
  i18n: I18nService,
  url?: string,
): ApiProblemDetails {
  const problem = isRecord(body) ? body : {};
  const errors = readErrorMessages(problem['errors'], i18n);
  const detail =
    readString(problem['detail']) ||
    readString(problem['message']) ||
    (typeof body === 'string' ? body.trim() : '');
  const safeDetail = isHttpClientFailureMessage(detail) ? '' : detail;
  const translatedDetail = safeDetail ? i18n.translate(safeDetail) : '';
  const rawTitle = readString(problem['title']);
  const title = resolveTitle(rawTitle, error.status, i18n);

  return {
    title,
    detail:
      errors.length > 0
        ? errors.slice(0, 3).join('\n')
        : translatedDetail || statusDescription(error.status, i18n, url),
    errors,
  };
}

function resolveTitle(rawTitle: string, status: number, i18n: I18nService): string {
  if (!rawTitle) {
    return statusTitle(status, i18n);
  }
  const translated = i18n.translate(rawTitle);
  if (translated !== rawTitle) {
    return translated;
  }
  const normalized = rawTitle.trim().toLowerCase();
  if (
    normalized === 'one or more validation errors occurred.' ||
    normalized === 'bad request' ||
    normalized === 'unauthorized' ||
    normalized === 'forbidden' ||
    normalized === 'not found' ||
    normalized === 'internal server error' ||
    normalized === 'an error occurred while processing your request.'
  ) {
    return statusTitle(status, i18n);
  }
  return rawTitle;
}

function parseProblemText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readErrorMessages(errors: unknown, i18n: I18nService): readonly string[] {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors
      .map((error) => {
        if (typeof error === 'string') {
          return i18n.translate(error.trim());
        }
        if (isRecord(error)) {
          const msg =
            readString(error['message']) ||
            readString(error['code']) ||
            readString(error['description']);
          return msg ? i18n.translate(msg) : '';
        }
        return '';
      })
      .filter((message) => message.length > 0);
  }

  if (isRecord(errors)) {
    const messages: string[] = [];
    for (const key of Object.keys(errors)) {
      const val = errors[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string' && item.trim()) {
            messages.push(i18n.translate(item.trim()));
          }
        }
      } else if (typeof val === 'string' && val.trim()) {
        messages.push(i18n.translate(val.trim()));
      }
    }
    return messages;
  }

  return [];
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

function statusDescription(status: number, i18n: I18nService, url?: string): string {
  if (status === 0) {
    return i18n.translate('toast.networkErrorDescription');
  }
  if (status === 401) {
    if (url && isAuthRequest(url)) {
      return i18n.translate('auth.invalidCredentials');
    }
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
