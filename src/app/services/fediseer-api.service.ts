import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {InstanceDetailResponse} from "../response/instance-detail.response";
import {environment} from "../../environments/environment";
import {catchError, map, Observable, of, switchMap} from "rxjs";
import {AuthenticationManagerService} from "./authentication-manager.service";
import {ErrorResponse} from "../response/error.response";
import {InstanceListResponse} from "../response/instance-list.response";
import {SuccessResponse} from "../response/success.response";
import {SuspiciousInstanceDetailResponse} from "../response/suspicious-instance-detail.response";

export interface ApiResponse<T> {
  success: boolean;
  successResponse?: T;
  errorResponse?: ErrorResponse;
}

enum HttpMethod {
  Get = 'GET',
  Put = 'PUT',
  Delete = 'DELETE',
}

@Injectable({
  providedIn: 'root'
})
export class FediseerApiService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authManager: AuthenticationManagerService,
  ) {
  }

  public get endorsementsBadgeUrl(): string {
    return this.createUrl(`badges/endorsements/${this.authManager.currentInstanceSnapshot.name}.svg`);
  }

  public get guaranteesBadgeUrl(): string {
    return this.createUrl(`badges/guarantees/${this.authManager.currentInstanceSnapshot.name}.svg`);
  }

  public getCurrentInstanceInfo(apiKey: string | null = null): Observable<ApiResponse<InstanceDetailResponse>> {
    const headers: {apikey?: string} = {};
    if (apiKey !== null) {
      headers.apikey = apiKey;
    }
    return this.sendRequest(HttpMethod.Get, 'find_instance', null, headers);
  }

  public getInstanceInfo(instance: string): Observable<ApiResponse<InstanceDetailResponse>> {
    return this.sendRequest(HttpMethod.Get, `whitelist/${instance}`);
  }

  public claimInstance(instance: string, admin: string): Observable<ApiResponse<InstanceDetailResponse>> {
    return this.sendRequest(HttpMethod.Put, `whitelist/${instance}`, {
      admin: admin,
    });
  }

  public getEndorsementsForInstance(instance: string): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `endorsements/${instance}`);
  }

  public getEndorsementsByInstance(instances: string[]): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    const instanceString = instances.join(',');
    return this.sendRequest(HttpMethod.Get, `approvals/${instanceString}`);
  }

  public endorseInstance(instance: string): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Put, `endorsements/${instance}`);
  }

  public cancelEndorsement(instance: string): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Delete, `endorsements/${instance}`);
  }

  public getGuaranteesByInstance(instance: string): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `guarantors/${instance}`);
  }

  public guaranteeInstance(instance: string): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Put, `guarantees/${instance}`);
  }

  public cancelGuarantee(instance: string): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Delete, `guarantees/${instance}`);
  }

  public getCensuresByInstances(instances: string[]): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `censures_given/${instances.join(',')}`);
  }

  public getCensuresForInstance(instance: string): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `censures/${instance}`);
  }

  public cancelCensure(instance: string): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Delete, `censures/${instance}`);
  }

  public censureInstance(instance: string, reason: string | null): Observable<ApiResponse<SuccessResponse>> {
    const body: {[key: string]: string} = {};
    if (reason) {
      body['reason'] = reason;
    }
    return this.sendRequest(HttpMethod.Put, `censures/${instance}`, body);
  }

  public getWhitelistedInstances(): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `whitelist`);
  }

  public getSuspiciousInstances(): Observable<ApiResponse<InstanceListResponse<SuspiciousInstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `instances`);
  }

  public getBlacklistedInstances(): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.getWhitelistedInstances().pipe(
      switchMap(response => {
        if (!response.success) {
          return of({
            success: response.success,
            errorResponse: response.errorResponse,
            successResponse: response.successResponse,
          });
        }

        const instances = response.successResponse!.instances.map(instance => instance.domain);
        return this.getCensuresByInstances(instances);
      }),
    );
  }

  private sendRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body: {[key: string]: string} | null = null,
    headers: {[header: string]: string} | null = null,
  ): Observable<ApiResponse<T>> {
    headers ??= {};
    headers['Client-Agent'] = `${environment.appName}:${environment.appVersion}:${environment.maintainer}`;
    if (this.authManager.currentInstanceSnapshot.apiKey) {
      headers['apikey'] ??= this.authManager.currentInstanceSnapshot.apiKey;
    }

    let url = this.createUrl(endpoint);
    if (method === HttpMethod.Get && body !== null) {
      url += new URLSearchParams(body).toString();
    }

    return this.httpClient.request<T|ErrorResponse>(method, url, {
      body: method === HttpMethod.Get ? undefined : body ?? undefined,
      headers: headers,
      observe: 'response',
    }).pipe(
      map (response => {
        return {
          success: response.ok,
          successResponse: response.ok ? <T>response.body : undefined,
          errorResponse: !response.ok ? <ErrorResponse>response.body : undefined,
        };
      }),
      catchError((err) => {
        return of({
          success: false,
          errorResponse: err.error,
        });
      }),
    );
  }

  private createUrl(endpoint: string): string {
    return `${environment.apiUrl}/${environment.apiVersion}/${endpoint}`;
  }
}
