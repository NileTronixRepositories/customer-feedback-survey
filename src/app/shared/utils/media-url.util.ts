import { environment } from '../../../environments/environment';

export function resolveMediaUrl(path: string | null | undefined): string | null {
  const normalizedPath = path?.trim();
  if (!normalizedPath) {
    return null;
  }

  if (/^(?:https?:|data:|blob:)/i.test(normalizedPath)) {
    return normalizedPath;
  }

  const baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  return `${baseUrl}/${normalizedPath.replace(/^\/+/, '')}`;
}
