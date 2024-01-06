import {Injectable} from '@angular/core';
import {Cache, CacheItem} from "./cache";

@Injectable({
  providedIn: 'root'
})
export class RuntimeCacheService implements Cache {
  private cache: {[key: string]: CacheItem<any>} = {};

  public getItem<T>(key: string): CacheItem<T> {
    const empty: CacheItem<T> = {
      key: key,
      isHit: false,
      value: undefined,
    };
    if (typeof this.cache[key] === 'undefined') {
      return empty;
    }

    const item = <CacheItem<T>>this.cache[key];
    if (!item.expiresAt) {
      return item;
    }

    if ((new Date().getTime()) > item.expiresAt.getTime()) {
      return empty;
    }

    return item;
  }

  public save(item: CacheItem<any>): void {
    this.cache[item.key] = {
      isHit: true,
      value: item.value,
      expiresAt: item.expiresAt,
      key: item.key,
    };
  }

  public remove(item: CacheItem<any>): void {
    this.removeByKey(item.key);
  }

  public removeByKey(key: string): void {
    delete this.cache[key];
  }

  public clear(): void {
    this.cache = {};
  }

  public clearByPrefix(prefix: string): void {
    for (const key of this.getKeysByPrefix(prefix)) {
      delete this.cache[key];
    }
  }

  public getKeysByPrefix(prefix: string): string[] {
    return Object.keys(this.cache).filter(key => key.startsWith(prefix));
  }
}
