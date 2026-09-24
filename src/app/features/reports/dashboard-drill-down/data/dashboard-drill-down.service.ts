import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  DashboardDetailsNavigation,
  DashboardDrillDownContext,
  DashboardResponseDetailItem,
  DashboardResponseDetails,
  DashboardResponseListItem,
  DashboardResponsesPage,
} from '../domain/dashboard-drill-down.model';

type ApiRecord = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class DashboardDrillDownService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  open(context: DashboardDrillDownContext): void {
    if (!this.isSupported(context.navigation)) {
      return;
    }

    void this.router.navigate(['/dashboard-responses'], {
      queryParams: {
        title: context.title,
        path: context.navigation.path,
        routeType: context.navigation.routeType,
      },
    });
  }

  loadResponses(path: string): Observable<DashboardResponsesPage> {
    return this.http
      .get<ApiRecord>(this.apiUrl(path))
      .pipe(map((response) => this.toResponsesPage(response)));
  }

  loadDetails(navigation: DashboardDetailsNavigation): Observable<DashboardResponseDetails> {
    if (!this.isSupported(navigation)) {
      throw new Error('Unsupported dashboard navigation');
    }

    return this.http
      .get<ApiRecord>(this.apiUrl(navigation.path))
      .pipe(map((response) => this.toResponseDetails(response)));
  }

  updatePath(
    originalPath: string,
    updates: Readonly<Partial<Record<'pageNumber' | 'pageSize' | 'searchText' | 'orderSort', string | number>>>,
  ): string {
    if (!this.parsePath(originalPath)) {
      return originalPath;
    }

    let path = originalPath;
    for (const [key, value] of Object.entries(updates)) {
      path = this.updateRawQueryParameter(path, key, value);
    }

    return path;
  }

  isSupported(navigation: DashboardDetailsNavigation | null | undefined): navigation is DashboardDetailsNavigation {
    return (
      navigation?.method === 'GET' &&
      navigation.path.startsWith('/api/') &&
      !navigation.path.startsWith('//')
    );
  }

  private apiUrl(path: string): string {
    const url = this.parsePath(path);
    if (!url || !url.pathname.startsWith('/api/')) {
      throw new Error('Invalid dashboard API path');
    }

    return `${environment.apiBaseUrl}${url.pathname}${url.search}`;
  }

  private parsePath(path: string): URL | null {
    try {
      return new URL(path, 'http://dashboard.local');
    } catch {
      return null;
    }
  }

  private updateRawQueryParameter(
    path: string,
    key: string,
    value: string | number | null | undefined,
  ): string {
    const [withoutHash, hash = ''] = path.split('#', 2);
    const queryIndex = withoutHash.indexOf('?');
    const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
    const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
    const encodedKey = encodeURIComponent(key);
    const nextValue = value === undefined || value === null ? '' : String(value).trim();
    const parameters = query.length > 0 ? query.split('&') : [];
    const existingIndex = parameters.findIndex(
      (parameter) => parameter.split('=', 1)[0].toLowerCase() === encodedKey.toLowerCase(),
    );

    if (nextValue.length === 0) {
      if (existingIndex >= 0) parameters.splice(existingIndex, 1);
    } else {
      const parameter = `${encodedKey}=${encodeURIComponent(nextValue)}`;
      if (existingIndex >= 0) parameters[existingIndex] = parameter;
      else parameters.push(parameter);
    }

    return `${pathname}${parameters.length > 0 ? `?${parameters.join('&')}` : ''}${hash ? `#${hash}` : ''}`;
  }

  private toResponsesPage(response: ApiRecord): DashboardResponsesPage {
    const data = this.readArray(response['data']).map((item) => this.toResponseListItem(item));
    const currentPage = this.readNumber(response, 'currentPage') || 1;
    const pageSize = this.readNumber(response, 'pageSize') || 10;
    const totalItems = this.readNumber(response, 'totalItems');
    const totalPages = this.readNumber(response, 'totalPages');

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: this.readBoolean(response, 'hasPreviousPage') || currentPage > 1,
      hasNextPage:
        this.readBoolean(response, 'hasNextPage') || (totalPages > 0 && currentPage < totalPages),
      data,
    };
  }

  private toResponseListItem(item: ApiRecord): DashboardResponseListItem {
    return {
      responseId:
        this.readString(item, 'responseId') ||
        this.readString(item, 'surveyResponseId') ||
        this.readString(item, 'anonymousSurveyResponseId'),
      source: this.toSource(this.readString(item, 'source')),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
      templateId:
        this.readString(item, 'templateId') || this.readString(item, 'anonymousTemplateId'),
      templateNameEn:
        this.readString(item, 'templateNameEn') ||
        this.readString(item, 'anonymousTemplateNameEn'),
      templateNameAr:
        this.readNullableString(item, 'templateNameAr') ??
        this.readNullableString(item, 'anonymousTemplateNameAr'),
      operatorId: this.readNullableString(item, 'operatorId'),
      operatorNameEn: this.readNullableString(item, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(item, 'operatorNameAr'),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      scorePercentage: this.readNullableNumber(item, 'scorePercentage'),
      isScored: this.readBoolean(item, 'isScored'),
      hasComplaint: this.readBoolean(item, 'hasComplaint'),
      hasVoice: this.readBoolean(item, 'hasVoice'),
      customInputsPreview: this.readArray(item['customInputsPreview']).map((input) => ({
        name: this.readString(input, 'name'),
        labelEn: this.readNullableString(input, 'labelEn'),
        labelAr: this.readNullableString(input, 'labelAr'),
        value: this.readDisplayValue(input['value']),
      })),
      detailsNavigation: this.toNavigation(this.readRecord(item['detailsNavigation'])),
    };
  }

  private toResponseDetails(response: ApiRecord): DashboardResponseDetails {
    const score = this.readRecord(response['score']);
    const template = this.readRecord(response['template']);
    const branch = this.readRecord(response['branch']);
    const operator = this.readRecord(response['operator']);
    return {
      responseId:
        this.readString(response, 'responseId') ||
        this.readString(response, 'surveyResponseId') ||
        this.readString(response, 'anonymousSurveyResponseId'),
      templateNameEn:
        this.readString(response, 'templateNameEn') ||
        this.readString(response, 'anonymousTemplateNameEn') ||
        this.readString(template, 'nameEn'),
      templateNameAr:
        this.readNullableString(response, 'templateNameAr') ??
        this.readNullableString(response, 'anonymousTemplateNameAr') ??
        this.readNullableString(template, 'nameAr'),
      branchNameEn:
        this.readString(response, 'branchNameEn') || this.readString(branch, 'nameEn'),
      branchNameAr:
        this.readNullableString(response, 'branchNameAr') ??
        this.readNullableString(branch, 'nameAr'),
      operatorNameEn:
        this.readNullableString(response, 'operatorNameEn') ??
        this.readNullableString(operator, 'nameEn'),
      operatorNameAr:
        this.readNullableString(response, 'operatorNameAr') ??
        this.readNullableString(operator, 'nameAr'),
      submittedOnUtc: this.readString(response, 'submittedOnUtc'),
      scorePercentage:
        this.readNullableNumber(score, 'scorePercentage') ??
        this.readNullableNumber(response, 'scorePercentage'),
      isScored: this.readBoolean(score, 'isScored') || this.readBoolean(response, 'isScored'),
      customInputs: this.readArray(response['customInputs'] ?? response['customInputValues']).map(
        (item) => this.toDetailItem(item, true),
      ),
      answers: this.readArray(response['answers']).map((item) => this.toDetailItem(item, false)),
    };
  }

  private toDetailItem(item: ApiRecord, customInput: boolean): DashboardResponseDetailItem {
    const labelEn = customInput
      ? this.readString(item, 'labelEn') || this.readString(item, 'name')
      : this.readString(item, 'questionTextEn');
    const labelAr = customInput
      ? this.readNullableString(item, 'labelAr')
      : this.readNullableString(item, 'questionTextAr');
    return {
      labelEn,
      labelAr,
      value:
        this.readString(item, 'displayValue') ||
        this.readString(item, 'textAnswer') ||
        this.readString(item, 'selectedOptionTextEn') ||
        this.readDisplayValue(item['stringValue'] ?? item['integerValue']),
      type: this.readString(item, customInput ? 'typeName' : 'questionTypeName'),
      voiceUrl:
        this.readNullableString(item, 'voiceFileUrl') ?? this.readNullableString(item, 'voiceUrl'),
      imageUrl:
        this.readNullableString(item, 'imageFileUrl') ?? this.readNullableString(item, 'imageUrl'),
      children: this.readArray(item['children'] ?? item['childAnswers']).map((child) =>
        this.toDetailItem(child, false),
      ),
    };
  }

  private toNavigation(record: ApiRecord | null): DashboardDetailsNavigation | null {
    const path = this.readString(record, 'path');
    if (!path || this.readString(record, 'method').toUpperCase() !== 'GET') {
      return null;
    }
    return { routeType: this.readString(record, 'routeType'), method: 'GET', path };
  }

  private toSource(value: string): 'Internal' | 'Anonymous' | null {
    return value === 'Internal' || value === 'Anonymous' ? value : null;
  }

  private readRecord(value: unknown): ApiRecord | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as ApiRecord)
      : null;
  }

  private readArray(value: unknown): ApiRecord[] {
    return Array.isArray(value)
      ? value.filter(
          (item): item is ApiRecord => typeof item === 'object' && item !== null && !Array.isArray(item),
        )
      : [];
  }

  private readString(record: ApiRecord | null, key: string): string {
    const value = record?.[key];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  private readNullableString(record: ApiRecord | null, key: string): string | null {
    const value = this.readString(record, key);
    return value.length > 0 ? value : null;
  }

  private readNumber(record: ApiRecord | null, key: string): number {
    return this.readNullableNumber(record, key) ?? 0;
  }

  private readNullableNumber(record: ApiRecord | null, key: string): number | null {
    const value = record?.[key];
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private readBoolean(record: ApiRecord | null, key: string): boolean {
    const value = record?.[key];
    return value === true || String(value).toLowerCase() === 'true';
  }

  private readDisplayValue(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
