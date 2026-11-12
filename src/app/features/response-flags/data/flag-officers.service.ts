import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  CreateFlagOfficer,
  FeedbackPage,
  FlagCapabilityRole,
  FlagOfficerChange,
  FlagOfficerDetails,
  FlagOfficerProfile,
} from '../domain/response-flags.model';

@Injectable({ providedIn: 'root' })
export class FlagOfficersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/api/flag-officers`;
  list(query: {
    pageNumber: number;
    pageSize: number;
    orderSort?: string;
    searchText?: string;
    departmentId?: string;
  }) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== '') params = params.set(key, value);
    return this.http.get<FeedbackPage<FlagOfficerDetails>>(this.url, { params });
  }
  details(id: string) {
    return this.http.get<FlagOfficerDetails>(`${this.url}/${encodeURIComponent(id)}`);
  }
  create(payload: CreateFlagOfficer) {
    return this.http.post<FlagOfficerChange>(this.url, payload);
  }
  update(id: string, payload: FlagOfficerProfile) {
    return this.http.put<FlagOfficerChange>(`${this.url}/${encodeURIComponent(id)}`, payload);
  }
  setActive(id: string, active: boolean) {
    return this.http.put<FlagOfficerChange>(
      `${this.url}/${encodeURIComponent(id)}/${active ? 'restore' : 'deactivate'}`,
      null,
    );
  }
  roles() {
    return this.http.get<readonly FlagCapabilityRole[]>(`${this.url}/roles-selection`);
  }
  assignRoles(id: string, roleIds: readonly string[]) {
    return this.http.put<readonly FlagCapabilityRole[]>(
      `${this.url}/${encodeURIComponent(id)}/roles`,
      { roleIds },
    );
  }
}
