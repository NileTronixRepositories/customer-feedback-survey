import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ResponseFlagApiDetails,
  SurveyResponseFlagType,
  toResponseFlag,
} from '../../../shared/models/response-flag.model';
import { DashboardDrillDownService } from '../../reports/dashboard-drill-down/data/dashboard-drill-down.service';
import {
  FeedbackPage,
  FlaggedResponseDetails,
  FlaggedResponseSummary,
  FlaggedResponsesQuery,
} from '../domain/response-flags.model';

@Injectable({ providedIn: 'root' })
export class ResponseFlagsService {
  private readonly http = inject(HttpClient);
  private readonly renderer = inject(DashboardDrillDownService);
  private readonly url = `${environment.apiBaseUrl}/api/response-flags`;
  list(query: FlaggedResponsesQuery) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    return this.http.get<FeedbackPage<FlaggedResponseSummary>>(`${this.url}/responses`, { params });
  }
  details(id: string) {
    return this.http
      .get<{ response: Record<string, unknown>; flags: readonly ResponseFlagApiDetails[] }>(
        `${this.url}/responses/${encodeURIComponent(id)}`,
      )
      .pipe(
        map((data): FlaggedResponseDetails => ({
          response: this.renderer.mapResponseDetails(data.response),
          flags: data.flags.map(toResponseFlag),
        })),
      );
  }
  flag(id: string) {
    return this.http
      .get<ResponseFlagApiDetails>(`${this.url}/${encodeURIComponent(id)}`)
      .pipe(map(toResponseFlag));
  }
  create(
    responseId: string,
    value: { type: SurveyResponseFlagType; brief: string; answer?: string },
  ) {
    return this.http.post<{ flagId: string; responseId: string }>(
      `${this.url}/responses/${encodeURIComponent(responseId)}`,
      value,
    );
  }
  editBrief(id: string, brief: string) {
    return this.http.put<{ flagId: string; responseId: string }>(
      `${this.url}/${encodeURIComponent(id)}/brief`,
      { brief },
    );
  }
  answer(id: string, answer: string) {
    return this.http.put<{ flagId: string; responseId: string }>(
      `${this.url}/${encodeURIComponent(id)}/answer`,
      { answer },
    );
  }
}
