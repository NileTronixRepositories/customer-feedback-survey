import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toCreatedByUser } from '../../../../shared/models/audit.model';
import {
  CopySuperAdminTemplateToBranchPayload,
  AssignGlobalAnonymousTemplateToBranchPayload,
  SuperAdminTemplateCopyApiResponse,
  SuperAdminTemplateCopyResult,
  SuperAdminTemplateApiResponse,
  SuperAdminTemplateCatalogKind,
  SuperAdminTemplateKind,
  SuperAdminTemplateListItem,
  SuperAdminTemplatesPageApiResponse,
  SuperAdminTemplatesPageResult,
  SuperAdminTemplatesQuery,
} from '../domain/super-admin-template.model';

@Injectable()
export class SuperAdminTemplatesService {
  private readonly http = inject(HttpClient);
  private readonly templatesUrl = `${environment.apiBaseUrl}/api/templates/super-admin`;
  private readonly anonymousTemplatesUrl = `${environment.apiBaseUrl}/api/anonymous-templates`;

  list(query: SuperAdminTemplatesQuery): Observable<SuperAdminTemplatesPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

    if (query.branchId.trim().length > 0) {
      params = params.set('branchId', query.branchId.trim());
    }
    if (query.templateKind) {
      params = params.set('templateKind', query.templateKind);
    }
    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }
    if (query.searchText.trim().length > 0) {
      params = params.set('searchText', query.searchText.trim());
    }
    if (query.orderSort.trim().length > 0) {
      params = params.set('orderSort', query.orderSort.trim());
    }

    return this.http
      .get<SuperAdminTemplatesPageApiResponse | readonly SuperAdminTemplateApiResponse[]>(
        this.templatesUrl,
        { params },
      )
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  copyToBranch(payload: CopySuperAdminTemplateToBranchPayload): Observable<SuperAdminTemplateCopyResult> {
    return this.http
      .post<SuperAdminTemplateCopyApiResponse | null>(`${this.templatesUrl}/copy-to-branch`, payload)
      .pipe(map((response) => this.toCopyResult(response, payload)));
  }

  assignGlobalToBranch(
    payload: AssignGlobalAnonymousTemplateToBranchPayload,
  ): Observable<SuperAdminTemplateCopyResult> {
    const formData = new FormData();
    formData.append('BranchId', payload.branchId);
    formData.append('ActiveFrom', payload.activeFrom);
    if (payload.expireTo) formData.append('ExpireTo', payload.expireTo);
    if (payload.logo) formData.append('Logo', payload.logo);

    return this.http
      .post<SuperAdminTemplateCopyApiResponse | null>(
        `${this.anonymousTemplatesUrl}/${payload.globalTemplateId}/assign-to-branch`,
        formData,
      )
      .pipe(
        map((response) =>
          this.toCopyResult(response, {
            templateId: payload.globalTemplateId,
            branchId: payload.branchId,
          }),
        ),
      );
  }

  private toPageResult(
    response: SuperAdminTemplatesPageApiResponse | readonly SuperAdminTemplateApiResponse[],
    query: SuperAdminTemplatesQuery,
  ): SuperAdminTemplatesPageResult {
    if (Array.isArray(response)) {
      const templates = response.map((template) => this.toTemplate(template));
      const totalPages = Math.max(1, Math.ceil(templates.length / query.pageSize));

      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalPages,
        totalItems: templates.length,
        data: templates,
        hasPreviousPage: query.pageNumber > 1,
        hasNextPage: query.pageNumber < totalPages,
      };
    }

    const pageResponse = response as SuperAdminTemplatesPageApiResponse;
    const templates = (pageResponse.data ?? []).map((template: SuperAdminTemplateApiResponse) =>
      this.toTemplate(template),
    );
    const currentPage = pageResponse.currentPage ?? query.pageNumber;
    const pageSize = pageResponse.pageSize ?? query.pageSize;
    const totalItems = pageResponse.totalItems ?? templates.length;
    const totalPages = pageResponse.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      data: templates,
      hasPreviousPage: pageResponse.hasPreviousPage ?? currentPage > 1,
      hasNextPage: pageResponse.hasNextPage ?? currentPage < totalPages,
    };
  }

  private toTemplate(response: SuperAdminTemplateApiResponse): SuperAdminTemplateListItem {
    const templateKind = this.toTemplateKind(response.templateKind);

    return {
      templateId: this.readRecordId(response.templateId),
      branchId: this.readNullableRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? null,
      branchNameAr: response.branchNameAr ?? null,
      templateKind,
      templateKindName: response.templateKindName ?? templateKind,
      nameEn: response.nameEn ?? null,
      nameAr: response.nameAr ?? null,
      description: response.description ?? null,
      scope: this.toScope(response.scope, response.scopeName),
      scopeName: response.scopeName ?? null,
      isGlobal: response.isGlobal ?? false,
      isArchived: response.isArchived ?? false,
      sourceGlobalAnonymousTemplateId: this.readNullableRecordId(
        response.sourceGlobalAnonymousTemplateId,
      ),
      isManagedGlobalCopy:
        response.isManagedGlobalCopy ??
        this.readNullableRecordId(response.sourceGlobalAnonymousTemplateId) !== null,
      isActive: response.isActive ?? true,
      logoPath: response.logoPath ?? null,
      questionsCount: response.questionsCount ?? 0,
      customInputsCount: response.customInputsCount ?? 0,
      publicUrl: response.publicUrl ?? null,
      qrCode: response.qrCode ?? null,
      createdByApplicationUserId: response.createdByApplicationUserId ?? null,
      createdBy: toCreatedByUser(response.createdBy ?? undefined),
      createdOnUtc: response.createdOnUtc ?? null,
      activeFrom: response.activeFrom ?? null,
      expireTo: response.expireTo ?? null,
    };
  }

  private toCopyResult(
    response: SuperAdminTemplateCopyApiResponse | null,
    payload: CopySuperAdminTemplateToBranchPayload,
  ): SuperAdminTemplateCopyResult {
    const templateKind = this.toTemplateKind(response?.templateKind ?? response?.kind);

    return {
      templateId: this.readRecordId(
        response?.templateId ??
          response?.newTemplateId ??
          response?.copiedTemplateId ??
          response?.branchTemplateId ??
          response?.anonymousTemplateId ??
          response?.id,
      ),
      branchId: this.readRecordId(response?.branchId) || payload.branchId,
      templateKind,
      templateKindName: response?.templateKindName ?? templateKind,
      nameEn: response?.nameEn ?? null,
      nameAr: response?.nameAr ?? null,
      publicUrl: response?.publicUrl ?? null,
      qrCode: response?.qrCode ?? null,
    };
  }

  private toTemplateKind(value: SuperAdminTemplateCatalogKind | string | number | null | undefined): SuperAdminTemplateKind {
    return value === 'Anonymous' || value === 2 || value === '2' ? 'Anonymous' : 'Authorized';
  }

  private readRecordId(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private readNullableRecordId(value: string | number | null | undefined): string | null {
    const id = this.readRecordId(value);
    return id.length > 0 ? id : null;
  }

  private toScope(
    value: string | number | null | undefined,
    name: string | null | undefined,
  ): 'Branch' | 'Global' | null {
    const normalized = String(name ?? value ?? '').trim().toLowerCase();
    if (normalized === 'global' || normalized === '2') return 'Global';
    if (normalized === 'branch' || normalized === '1') return 'Branch';
    return null;
  }
}
