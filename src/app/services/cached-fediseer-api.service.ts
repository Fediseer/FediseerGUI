import {Injectable} from '@angular/core';
import {ApiResponse, FediseerApiService} from "./fediseer-api.service";
import {RuntimeCacheService} from "./cache/runtime-cache.service";
import {Observable, of, tap} from "rxjs";
import {InstanceDetailResponse} from "../response/instance-detail.response";
import {int} from "../types/number";
import {PermanentCacheService} from "./cache/permanent-cache.service";
import {Cache, CacheItem} from "./cache/cache";
import {InstanceListResponse} from "../response/instance-list.response";

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

  public getWhitelistedInstances(cacheConfig: CacheConfiguration = {}): Observable<ApiResponse<InstanceListResponse<InstanceDetailResponse>>> {
    cacheConfig.type ??= CacheType.Permanent;
    cacheConfig.ttl ??= 120;

    const cacheKey = `api.whitelist${cacheConfig.ttl}`;
    const item = this.getCacheItem<InstanceListResponse<InstanceDetailResponse>>(cacheKey, cacheConfig)!;
    if (item.isHit && !cacheConfig.clear) {
      return this.getSuccessResponse(item);
    }

    return this.api.getWhitelistedInstances().pipe(
      tap(this.storeResponse(item, cacheConfig)),
    );
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
