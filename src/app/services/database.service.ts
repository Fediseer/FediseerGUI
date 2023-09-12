import {Injectable} from '@angular/core';
import {Instance} from "../user/instance";
import {SynchronizationMode, SynchronizeSettings} from "../types/synchronize-settings";
import {CensureListFilters} from "../types/censure-list-filters";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly storedInstanceKey = 'instance';
  private readonly lemmySynchronizationSettingsKey = 'sync_settings_lemmy';
  private readonly lemmyPasswordKey = 'lemmy_password';
  private readonly censureListFiltersKey = 'censure_list_filters';

  public getStoredInstance(): Instance | null {
    const stored = localStorage.getItem(this.storedInstanceKey);
    if (stored !== null) {
      return JSON.parse(stored);
    }

    return null;
  }

  public get lemmyPassword(): string | null {
    return sessionStorage.getItem(this.lemmyPasswordKey);
  }

  public set lemmyPassword(password: string) {
    sessionStorage.setItem(this.lemmyPasswordKey, password);
  }

  public setStoredInstance(instance: Instance): void {
    localStorage.setItem(this.storedInstanceKey, JSON.stringify(instance));
  }

  public removeStoredInstance(): void {
    localStorage.removeItem(this.storedInstanceKey);
  }

  public getLemmySynchronizationSettings(): SynchronizeSettings {
    const stored = localStorage.getItem(this.lemmySynchronizationSettingsKey);
    if (stored !== null) {
      return JSON.parse(stored);
    }

    return {
      username: '',
      purge: false,
      mode: SynchronizationMode.Own,
      customInstances: [],
    };
  }

  public setLemmySynchronizationSettings(settings: SynchronizeSettings): void {
    localStorage.setItem(this.lemmySynchronizationSettingsKey, JSON.stringify(settings));
  }

  public get censureListFilters(): CensureListFilters {
    const stored = localStorage.getItem(this.censureListFiltersKey);
    if (stored !== null) {
      return JSON.parse(stored);
    }

    return {
      instances: [],
      onlyMatching: false,
      matchingReasons: [],
      includeGuaranteed: false,
      includeEndorsed: false,
      recursive: false,
    };
  }

  public set censureListFilters(filters: CensureListFilters) {
    localStorage.setItem(this.censureListFiltersKey, JSON.stringify(filters));
  }
}
