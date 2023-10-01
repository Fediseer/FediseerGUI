import {Injectable} from '@angular/core';
import {ApiResponse, FediseerApiService} from "./fediseer-api.service";
import {RuntimeCacheService} from "./cache/runtime-cache.service";
import {map, Observable, of, tap} from "rxjs";
import {InstanceDetailResponse} from "../response/instance-detail.response";
import {int} from "../types/number";
import {PermanentCacheService} from "./cache/permanent-cache.service";
import {Cache, CacheItem} from "./cache/cache";
import {InstanceListResponse} from "../response/instance-list.response";
import {WhitelistFilter} from "../types/whitelist-filter";

export enum CacheType {
  Runtime,
  Permanent,
}

export interface CacheConfiguration {
  type?: CacheType;
  clear?: boolean;
  ttl?: int;
}

@Injectable({
  providedIn: 'root'
})
export class CachedFediseerApiService {
  constructor(
    private readonly api: FediseerApiService,
    private readonly runtimeCache: RuntimeCacheService,
    private readonly permanentCache: PermanentCacheService,
  ) {
  }

  public getCurrentInstanceInfo(apiKey: string | null = null, cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceDetailResponse>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 300;

    const cacheKey = `api.current_instance.${cacheConfig.ttl}.${apiKey}`;

    const item = this.getCacheItem<InstanceDetailResponse>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getCurrentInstanceInfo(apiKey).pipe(
      tap (this.storeResponse(item, cacheConfig)),
    );
  }

  public getCensuresByInstances(instances: string[], cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 60;

    const cacheKey = `api.censures_by_instances${cacheConfig.ttl}.${instances.join('_')}`;
    const item = this.getCacheItem<InstanceListResponse<InstanceDetailResponse>>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getCensuresByInstances(instances).pipe(
      tap(this.storeResponse(item, cacheConfig)),
    );
  }

  public getWhitelistedInstances(whitelistFilter: WhitelistFilter = {}, cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 120;

    const cacheKey = `api.whitelist${cacheConfig.ttl}.${JSON.stringify(whitelistFilter)}`;
    const item = this.getCacheItem<InstanceListResponse<InstanceDetailResponse>>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getWhitelistedInstances(whitelistFilter).pipe(
      tap(this.storeResponse(item, cacheConfig)),
    );
  }

  public clearWhitelistCache(): void {
    this.runtimeCache.clearByPrefix('api.whitelist');
    this.permanentCache.clearByPrefix('api.whitelist');
  }

  public getHesitationsByInstances(instances: string[], cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 60;

    const cacheKey = `api.hesitations_by_instances${cacheConfig.ttl}.${instances.join('_')}`;

    const item = this.getCacheItem<InstanceListResponse<InstanceDetailResponse>>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getHesitationsByInstances(instances).pipe(
      tap(this.storeResponse(item, cacheConfig)),
    );
  }

  public getEndorsementsByInstances(instances: string[], cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 60;

    const cacheKey = `api.endorsements_by_instances${cacheConfig.ttl}.${instances.join('_')}`;

    const item = this.getCacheItem<InstanceListResponse<InstanceDetailResponse>>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getEndorsementsByInstances(instances).pipe(
      tap(this.storeResponse(item, cacheConfig)),
    );
  }

  public getGuaranteesByInstance(instance: string, cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 300;

    const cacheKey = `api.guarantees_by_instances${cacheConfig.ttl}.${instance}`;

    const item = this.getCacheItem<InstanceListResponse<InstanceDetailResponse>>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getGuaranteesByInstance(instance).pipe(
      tap(this.storeResponse(item, cacheConfig)),
    );
  }

  public getUsedEndorsementReasons(cacheConfig: CacheConfiguration = {}): Observable<string[] | null> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 300;

    const cacheKey = `api.endorsement_reasons${cacheConfig.ttl}`;

    const item = this.getCacheItem<string[] | null>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return of(item.value!);
    }

    return this.api.getUsedEndorsementReasons().pipe(
      tap(result => {
        item.value = result;
        if (item.value === null) {
          return;
        }
        if (cacheConfig.ttl! >= 0) {
          item.expiresAt = new Date(new Date().getTime() + (cacheConfig.ttl! * 1_000));
        }
        this.saveCacheItem(item, cacheConfig);
      }),
    );
  }

  public getUsedReasons(instances: string[] = [], cacheConfig: CacheConfiguration = {}): Observable<string[] | null> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 300;

    const cacheKey = `api.reasons${cacheConfig.ttl}.${instances.join('_')}`;

    const item = this.getCacheItem<string[] | null>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return of(item.value!);
    }

    return this.api.getUsedReasons(instances).pipe(
      tap(result => {
        item.value = result;
        if (item.value === null) {
          return;
        }
        if (cacheConfig.ttl! >= 0) {
          item.expiresAt = new Date(new Date().getTime() + (cacheConfig.ttl! * 1_000));
        }
        this.saveCacheItem(item, cacheConfig);
      }),
    );
  }

  public getAvailableTags(cacheConfig: CacheConfiguration = {}): Observable<string[]> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 300;

    const cacheKey = `api.tags${cacheConfig.ttl}`;

    const item = this.getCacheItem<string[] | null>(cacheKey, cacheConfig)!;

    if (item.isHit && !cacheConfig.clear) {
      return of(item.value!);
    }

    return this.getWhitelistedInstances()
      .pipe(
        map (response => {
          if (!response.success) {
            return [];
          }

          return response.successResponse!.instances.flatMap(instance => instance.tags);
        }),
        tap (result => {
          item.value = result;
          if (cacheConfig.ttl! >= 0) {
            item.expiresAt = new Date(new Date().getTime() + (cacheConfig.ttl! * 1_000));
          }
          this.saveCacheItem(item, cacheConfig);
        }),
      )
  }

  public clearCache(): void {
    this.runtimeCache.clear();
    this.permanentCache.clear();
  }

  private storeResponse<T>(item: CacheItem<T>, cache: CacheConfiguration): ((response: ApiResponse<T>) => void) {
    return response => {
      if (!response.success) {
        return;
      }

      item.value = response.successResponse;
      if (cache.ttl! >= 0) {
        item.expiresAt = new Date(new Date().getTime() + (cache.ttl! * 1_000));
      }
      this.saveCacheItem(item, cache);
    }
  }

  private getSuccessResponse<T>(item: CacheItem<T>): Observable<ApiResponse<T>> {
    return of({
      success: true,
      successResponse: item.value,
      statusCode: 200,
    });
  }

  private getCacheItem<T>(name: string, config: CacheConfiguration): CacheItem<T> | null {
    config.type ??= CacheType.Runtime;
    config.clear ??= false;
    config.ttl ??= 60;

    const cache = this.getCache(config.type);

    if (cache === null) {
      return null;
    }

    let cacheItem = cache.getItem<T>(name);
    if (cacheItem.isHit && config.clear) {
      cache.remove(cacheItem);
      cacheItem = cache.getItem<T>(name);
    }

    return cacheItem;
  }

  private saveCacheItem(cacheItem: CacheItem<any>, config: CacheConfiguration): void {
    config.ttl ??= 60;
    config.type ??= CacheType.Runtime;

    const cache = this.getCache(config.type);
    if (cache === null) {
      throw new Error("Failed getting cache handler, invalid type");
    }

    cache.save(cacheItem);
  }

  private getCache(type: CacheType): Cache | null {
    let cache: Cache | null = null;
    switch (type) {
      case CacheType.Runtime:
        cache = this.runtimeCache;
        break;
      case CacheType.Permanent:
        cache = this.permanentCache;
        break;
    }

    return cache;
  }
}
