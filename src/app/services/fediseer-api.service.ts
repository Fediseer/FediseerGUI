import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {InstanceDetailResponse} from "../response/instance-detail.response";
import {environment} from "../../environments/environment";
import {catchError, forkJoin, map, Observable, of, switchMap, tap} from "rxjs";
import {AuthenticationManagerService} from "./authentication-manager.service";
import {ErrorResponse} from "../response/error.response";
import {InstanceListResponse} from "../response/instance-list.response";
import {SuccessResponse} from "../response/success.response";
import {SuspiciousInstanceDetailResponse} from "../response/suspicious-instance-detail.response";
import {NormalizedInstanceDetailResponse} from "../response/normalized-instance-detail.response";
import {EditableInstanceData} from "../types/editable-instance-data";
import {ChangedResponse} from "../response/changed.response";
import {ActionLogResponse} from "../response/action-log.response";
import {RuntimeCacheService} from "./cache/runtime-cache.service";
import {int} from "../types/number";
import {ResetApiKeyResponse} from "../response/reset-api-key.response";

export interface ApiResponse<T> {
  success: boolean;
  successResponse?: T;
  errorResponse?: ErrorResponse;
}

enum HttpMethod {
  Get = 'GET',
  Put = 'PUT',
  Delete = 'DELETE',
  Patch = 'PATCH',
}

@Injectable({
  providedIn: 'root'
})
export class FediseerApiService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authManager: AuthenticationManagerService,
    private readonly runtimeCache: RuntimeCacheService,
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

  public censureInstance(instance: string, reason: string | null, evidence: string | null = null): Observable<ApiResponse<SuccessResponse>> {
    const body: {[key: string]: string} = {};
    if (reason) {
      body['reason'] = reason;
    }
    if (evidence) {
      body['evidence'] = evidence;
    }
    return this.sendRequest(HttpMethod.Put, `censures/${instance}`, body);
  }

  public updateCensure(instance: string, reason: string | null, evidence: string | null): Observable<ApiResponse<SuccessResponse>> {
    const body: {[key: string]: string} = {};
    if (reason) {
      body['reason'] = reason;
    }
    body['evidence'] = evidence ?? '';
    return this.sendRequest(HttpMethod.Patch, `censures/${instance}`, body);
  }

  public getHesitationsByInstances(instances: string[]): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `hesitations_given/${instances.join(',')}`);
  }

  public getHesitationsForInstance(instance: string): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `hesitations/${instance}`);
  }

  public hesitateOnAnInstance(instance: string, reason: string | null, evidence: string | null = null): Observable<ApiResponse<SuccessResponse>> {
    const body: {[key: string]: string} = {};
    if (reason) {
      body['reason'] = reason;
    }
    if (evidence) {
      body['evidence'] = evidence;
    }
    return this.sendRequest(HttpMethod.Put, `hesitations/${instance}`, body);
  }

  public cancelHesitation(instance: string): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Delete, `hesitations/${instance}`);
  }

  public updateHesitation(instance: string, reason: string | null, evidence: string | null): Observable<ApiResponse<SuccessResponse>> {
    const body: {[key: string]: string} = {};
    if (reason) {
      body['reason'] = reason;
    }
    body['evidence'] = evidence ?? '';
    return this.sendRequest(HttpMethod.Patch, `hesitations/${instance}`, body);
  }

  public getWhitelistedInstances(): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `whitelist`);
  }

  public getSuspiciousInstances(): Observable<ApiResponse<InstanceListResponse<SuspiciousInstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `instances`);
  }

  public getCensuredInstances(): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
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

  public getUsedReasons(instances: string[] = []): Observable<string[] | null> {
    const cacheItem = this.runtimeCache.getItem<string[]>(`used_reasons_${instances.join(',')}`);
    if (cacheItem.isHit) {
      return of(cacheItem.value!);
    }

    const result = instances.length > 0 ? this.getCensuresByInstances(instances) : this.getCensuredInstances();

    return result.pipe(
      map (response => {
        if (!response.success) {
          return null;
        }

        const instances = response.successResponse!.instances
          .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));

        let reasons: string[] = [];

        for (const instance of instances) {
          reasons = [...reasons, ...instance.unmergedCensureReasons];
        }

        return [...new Set(reasons)];
      }),
      tap (reasons => {
        if (reasons === null) {
          return;
        }
        cacheItem.value = reasons;
        this.runtimeCache.save(cacheItem);
      })
    );
  }

  public updateInstanceData(instance: string, data: EditableInstanceData): Observable<ApiResponse<ChangedResponse>> {
    const body = {...data};
    if (body.sysadmins === null) {
      delete body.sysadmins;
    }
    if (body.moderators === null) {
      delete body.moderators;
    }
    return this.sendRequest(HttpMethod.Patch, `whitelist/${instance}`, body);
  }

  public getActionLog(pageStart: int = 1, pageEnd: int = 1): Observable<ActionLogResponse|null> {
    const requests: Observable<ApiResponse<ActionLogResponse>>[] = [];
    for (let i = pageStart; i <= pageEnd; ++i) {
      requests.push(this.sendRequest<ActionLogResponse>(HttpMethod.Get, `reports`, {page: String(i)}));
    }
    return forkJoin(requests).pipe(
      map (responses => {
        let result: ActionLogResponse = [];
        for (const response of responses) {
          if (!response.success) {
            return null;
          }
          result = [...result, ...response.successResponse!];
        }

        return result;
      }),
    );
  }

  public resetApiKey(instance: string, adminUsername: string): Observable<ApiResponse<ResetApiKeyResponse>> {
    return this.sendRequest(HttpMethod.Patch, `whitelist/${instance}`, {
      return_new_key: true,
      admin_username: adminUsername,
    });
  }

  private sendRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body: {[key: string]: string | number | null | boolean} | null = null,
    headers: {[header: string]: string} | null = null,
  ): Observable<ApiResponse<T>> {
    headers ??= {};
    headers['Client-Agent'] = `${environment.appName}:${environment.appVersion}:${environment.maintainer}`;
    if (this.authManager.currentInstanceSnapshot.apiKey) {
      headers['apikey'] ??= this.authManager.currentInstanceSnapshot.apiKey;
    }

    let url = this.createUrl(endpoint);
    if (method === HttpMethod.Get && body !== null) {
      for (const key of Object.keys(body)) {
        if (typeof body[key] !== 'string') {
          delete body[key];
        }
      }
      url += '?' + new URLSearchParams(<any>body).toString();
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
