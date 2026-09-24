import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchTemplatesPdfReportLanguage,
  BranchTemplatesPdfReportQuery,
  BranchTemplatesReportExportRequest,
  BranchTemplatesReportFile,
  BranchTemplatesReportPreview,
  BranchTemplatesReportPreviewRequest,
} from '../domain/branch-templates-pdf-report.model';

@Injectable()
export class BranchTemplatesPdfReportService {
  private readonly http = inject(HttpClient);
  private readonly pdfReportUrl = `${environment.apiBaseUrl}/api/reports/templates/pdf`;
  private readonly excelReportUrl = `${environment.apiBaseUrl}/api/reports/templates/excel`;
  private readonly previewReportUrl = `${environment.apiBaseUrl}/api/reports/templates`;

  downloadPdf(request: BranchTemplatesReportExportRequest): Observable<BranchTemplatesReportFile> {
    return this.http.get(this.pdfReportUrl, {
      params: this.toParams(request.query),
      headers: new HttpHeaders({
        'Accept-Language': this.toAcceptLanguage(request.language),
      }),
      responseType: 'blob',
      observe: 'response',
    }).pipe(
      map((response) => this.toReportFile(response, 'X-Pdf-File-Name')),
      catchError((error: unknown) => this.normalizeBlobError(error)),
    );
  }

  preview(request: BranchTemplatesReportPreviewRequest): Observable<BranchTemplatesReportPreview> {
    return this.http.get<BranchTemplatesReportPreview>(this.previewReportUrl, {
      params: this.toParams(request.query),
      headers: new HttpHeaders({
        'Accept-Language': this.toAcceptLanguage(request.language),
      }),
    });
  }

  downloadExcel(request: BranchTemplatesReportExportRequest): Observable<BranchTemplatesReportFile> {
    return this.http.get(this.excelReportUrl, {
        params: this.toParams(request.query),
        headers: new HttpHeaders({
          'Accept-Language': this.toAcceptLanguage(request.language),
        }),
        responseType: 'blob',
        observe: 'response',
      }).pipe(
        map((response) => this.toReportFile(response, 'X-Excel-File-Name')),
        catchError((error: unknown) => this.normalizeBlobError(error)),
      );
  }

  private toParams(query: BranchTemplatesPdfReportQuery): HttpParams {
    let params = new HttpParams()
      .set('FromDate', query.fromDate)
      .set('ToDate', query.toDate);

    if (query.templateId) {
      params = params.set('TemplateId', query.templateId);
    }

    if (query.templateKind) {
      params = params.set('TemplateKind', query.templateKind === 'Normal' ? '1' : '2');
    }

    if (query.scoreCalculationMode) {
      params = params.set(
        'ScoreCalculationMode',
        query.scoreCalculationMode === 'RootQuestions' ? '1' : '2',
      );
    }

    if (query.topWorstQuestionsCount !== undefined) {
      params = params.set('TopWorstQuestionsCount', String(query.topWorstQuestionsCount));
    }

    if (query.worstQuestionsMaxScorePercentage !== undefined) {
      params = params.set(
        'WorstQuestionsMaxScorePercentage',
        String(query.worstQuestionsMaxScorePercentage),
      );
    }

    if (query.bestQuestionsMinScorePercentage !== undefined) {
      params = params.set(
        'BestQuestionsMinScorePercentage',
        String(query.bestQuestionsMinScorePercentage),
      );
    }

    return params;
  }

  private toReportFile(
    response: HttpResponse<Blob>,
    fileNameHeader: 'X-Pdf-File-Name' | 'X-Excel-File-Name',
  ): BranchTemplatesReportFile {
    return {
      blob: response.body ?? new Blob(),
      fileName: this.decodeFileName(response.headers.get(fileNameHeader)),
    };
  }

  private decodeFileName(value: string | null): string | null {
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private normalizeBlobError(error: unknown): Observable<never> {
    if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
      return throwError(() => error);
    }

    return from(error.error.text()).pipe(
      map((body) => {
        try {
          return JSON.parse(body) as unknown;
        } catch {
          return body;
        }
      }),
      switchMap((body) =>
        throwError(
          () =>
            new HttpErrorResponse({
              error: body,
              headers: error.headers,
              status: error.status,
              statusText: error.statusText,
              url: error.url ?? undefined,
            }),
        ),
      ),
    );
  }

  private toAcceptLanguage(language: BranchTemplatesPdfReportLanguage | undefined): string {
    return language === 'Arabic' ? 'ar' : 'en';
  }
}
