import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchEvaluationSettings,
  UpdateBranchEvaluationSettingsRequest,
} from '../domain/branch-evaluation-settings.model';

@Injectable({ providedIn: 'root' })
export class BranchEvaluationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly branchesUrl = `${environment.apiBaseUrl}/api/branches`;

  getEvaluationSettings(branchId: string): Observable<BranchEvaluationSettings> {
    return this.http.get<BranchEvaluationSettings>(
      `${this.branchesUrl}/${branchId}/evaluation-settings`,
    );
  }

  updateEvaluationSettings(
    branchId: string,
    payload: UpdateBranchEvaluationSettingsRequest,
  ): Observable<BranchEvaluationSettings> {
    return this.http.put<BranchEvaluationSettings>(
      `${this.branchesUrl}/${branchId}/evaluation-settings`,
      payload,
    );
  }
}
