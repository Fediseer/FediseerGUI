import {Cache, CacheItem} from "./cache";
import {Injectable} from "@angular/core";

interface PartialItem<T> {
  date?: string;
  value: T;
}

@Injectable({
  providedIn: 'root',
})
export class PermanentCacheService implements Cache {
  private readonly prefix = 'app_cache';

  getItem<T>(key: string): CacheItem<T> {
    const empty: CacheItem<T> = {
      key: key,
      isHit: false,
      value: undefined,
    };

    if (typeof localStorage === 'undefined') {
      return empty;
    }

    const stored = localStorage.getItem(this.getKey(key));
    if (stored === null) {
      return empty;
    }

    const partialItem: PartialItem<T> = JSON.parse(stored);

    const item: CacheItem<T> = {
      key: key,
      isHit: true,
      value: partialItem.value,
      expiresAt: partialItem.date ? new Date(partialItem.date) : undefined,
    };

    if (!item.expiresAt) {
      return item;
    }

    if ((new Date().getTime()) > item.expiresAt.getTime()) {
      this.remove(item);
      return empty;
    }

    return item;
  }

  public save(item: CacheItem<any>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.getKey(item.key), JSON.stringify({
      date: item.expiresAt ? item.expiresAt.toISOString() : undefined,
      value: item.value,
    }));
  }

  public remove(item: CacheItem<any>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.getKey(item.key));
  }

  public clear(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    for (const key of Object.keys(localStorage).filter(key => key.startsWith(`${this.prefix}.`))) {
      localStorage.removeItem(key);
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}.${key}`;
  }
}
