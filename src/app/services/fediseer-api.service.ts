import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {InstanceDetailResponse} from "../response/instance-detail.response";
import {environment} from "../../environments/environment";
import {catchError, EMPTY, expand, forkJoin, map, Observable, of, reduce, switchMap, tap} from "rxjs";
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
import {PrivateMessageProxy} from "../types/private-message-proxy";
import {SolicitationInstanceDetailResponse} from "../response/solicitation-instance-detail.response";
import {ActionLogFilter} from "../types/action-log.filter";
import {WhitelistFilter} from "../types/whitelist-filter";

export interface ApiResponse<T> {
  success: boolean;
  successResponse?: T;
  errorResponse?: ErrorResponse;
  statusCode: int;
}

enum HttpMethod {
  Get = 'GET',
  Put = 'PUT',
  Delete = 'DELETE',
  Patch = 'PATCH',
  Post = 'POST',
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

  public claimInstance(instance: string, admin: string, proxy: PrivateMessageProxy): Observable<ApiResponse<InstanceDetailResponse>> {
    return this.sendRequest(HttpMethod.Put, `whitelist/${instance}`, {
      admin: admin,
      pm_proxy: proxy,
    });
  }

  public getEndorsementsForInstance(instance: string): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `endorsements/${instance}`);
  }

  public getEndorsementsByInstances(instances: string[]): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    const instanceString = instances.join(',');
    return this.sendRequest(HttpMethod.Get, `approvals/${instanceString}`);
  }

  public endorseInstance(instance: string, reason: string | null = null): Observable<ApiResponse<SuccessResponse>> {
    const body: {reason?: string} = {};
    if (reason) {
      body.reason = reason;
    }
    return this.sendRequest(HttpMethod.Put, `endorsements/${instance}`, body);
  }

  public updateEndorsement(instance: string, reason: string | null): Observable<ApiResponse<SuccessResponse>> {
    const body: {[key: string]: string} = {};
    if (reason) {
      body['reason'] = reason;
    }
    return this.sendRequest(HttpMethod.Patch, `endorsements/${instance}`, body);
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

  public getWhitelistedInstances(filter: WhitelistFilter = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    const maxPerPage = 100; // from api

    let body: {[key: string]: string} = {};
    if (filter.tags !== undefined) {
      body['tags_csv'] = filter.tags.join(',');
    }

    const sendRequest = (page: number, limit: number): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> => this.sendRequest(
      HttpMethod.Get,
      `whitelist`,
      {
        page: String(page),
        limit: String(limit),
        ...body,
      },
    );

    let currentPage = 1;

    return sendRequest(currentPage, maxPerPage).pipe(
      expand (response => {
        if (!response.success) {
          return EMPTY;
        }
        if (!response.successResponse!.instances.length) {
          return EMPTY;
        }
        if (response.successResponse!.instances.length < maxPerPage) {
          return EMPTY;
        }

        return sendRequest(++currentPage, maxPerPage);
      }),
      reduce((acc, value) => {
        if (!value.success || !acc.success) {
          return acc;
        }
        acc.successResponse!.instances = [...acc.successResponse!.instances, ...value.successResponse!.instances];

        return acc;
      }),
    );
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
            statusCode: response.statusCode,
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

  public getUsedEndorsementReasons(): Observable<string[] | null> {
    const cacheItem = this.runtimeCache.getItem<string[]>(`used_endorsement_reasons`);
    if (cacheItem.isHit) {
      return of(cacheItem.value!);
    }

    return this.getEndorsementsByInstances([this.authManager.currentInstanceSnapshot.name]).pipe(
      map (response => {
        if (!response.success) {
          return null;
        }

        const instances = response.successResponse!.instances
          .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));

        let reasons: string[] = [];

        for (const instance of instances) {
          reasons = [...reasons, ...instance.unmergedEndorsementReasons];
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

  public getActionLog(
    pageStart: int = 1,
    pageEnd: int = 1,
    filter: ActionLogFilter = {},
  ): Observable<ActionLogResponse|null> {
    const body: {[key: string]: string} = {};
    if (filter.activity !== undefined) {
      body['report_activity'] = filter.activity;
    }
    if (filter.type !== undefined) {
      body['report_type'] = filter.type;
    }
    if (filter.sourceDomains !== undefined) {
      body['source_domains_csv'] = filter.sourceDomains.join(',');
    }
    if (filter.targetDomains !== undefined) {
      body['target_domains_csv'] = filter.targetDomains.join(',');
    }

    const requests: Observable<ApiResponse<ActionLogResponse>>[] = [];
    for (let i = pageStart; i <= pageEnd; ++i) {
      const localBody = {...body};
      localBody['page'] = String(i);
      requests.push(this.sendRequest<ActionLogResponse>(HttpMethod.Get, `reports`, localBody));
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

  public getSolicitations(): Observable<ApiResponse<InstanceListResponse<SolicitationInstanceDetailResponse>>> {
    return this.sendRequest(HttpMethod.Get, `solicitations`);
  }

  public solicitGuarantee(guarantor: string | null = null, comment: string | null = null): Observable<ApiResponse<SuccessResponse>> {
    const body: {guarantor?: string, comment?: string} = {};
    if (guarantor) {
      body.guarantor = guarantor;
    }
    if (comment) {
      body.comment = comment;
    }

    return this.sendRequest(HttpMethod.Post, `solicitations`, body);
  }

  public tagInstance(tags: string[]): Observable<ApiResponse<ChangedResponse>> {
    return this.sendRequest(HttpMethod.Put, `tags`, {
      tags_csv: tags.join(','),
    });
  }

  public removeInstanceTags(tags: string[]): Observable<ApiResponse<SuccessResponse>> {
    return this.sendRequest(HttpMethod.Delete, `tags`, {
      tags_csv: tags.join(','),
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
          statusCode: response.status,
        };
      }),
      catchError((err: HttpErrorResponse) => {
        return of({
          success: false,
          errorResponse: err.error,
          statusCode: err.status,
        });
      }),
    );
  }

  private createUrl(endpoint: string): string {
    return `${environment.apiUrl}/${environment.apiVersion}/${endpoint}`;
  }
}
