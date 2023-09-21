import {Injectable} from '@angular/core';
import {Instance} from "../user/instance";
import {LemmySynchronizationSettings} from "../types/lemmy-synchronization-settings";
import {CensureListFilters} from "../types/censure-list-filters";
import {SynchronizationMode} from "../types/synchronization-mode";
import {MastodonSynchronizationSettings} from "../types/mastodon-synchronization-settings";
import {MastodonBlacklistSeverity} from "../response/mastodon-blacklist.response";
import {BehaviorSubject, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly storedInstanceKey = 'instance';
  private readonly lemmySynchronizationSettingsKey = 'sync_settings_lemmy';
  private readonly mastodonSynchronizationSettingsKey = 'sync_settings_mstdn';
  private readonly lemmyPasswordKey = 'lemmy_password';
  private readonly censureListFiltersKey = 'censure_list_filters';
  private readonly availableAccountsKey = 'available_accounts';

  private readonly _availableAccountsObservable = new BehaviorSubject<Instance[]>(this.availableAccounts);

  public get availableAccountsObservable(): Observable<Instance[]> {
    return this._availableAccountsObservable;
  }

  public get availableAccounts(): Instance[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const stored = localStorage.getItem(this.availableAccountsKey);
    if (stored === null) {
      const currentInstance = this.getStoredInstance();
      if (currentInstance === null || currentInstance.anonymous) {
        return [];
      }
      this.availableAccounts = [currentInstance];
      return [this.getStoredInstance()!];
    }

    return JSON.parse(stored);
  }

  public set availableAccounts(instances: Instance[]) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.availableAccountsKey, JSON.stringify(instances));
    this._availableAccountsObservable?.next(instances);
  }

  public addAvailableAccount(instance: Instance): void {
    const availableAccounts = this.availableAccounts;
    if (availableAccounts.map(instance => instance.name).includes(instance.name)) {
      return;
    }
    availableAccounts.push(instance);
    this.availableAccounts = availableAccounts;
  }

  public removeAvailableAccount(instance: Instance | string): void {
    if (typeof instance !== 'string') {
      instance = instance.name;
    }
    this.availableAccounts = this.availableAccounts.filter(storedAccount => storedAccount.name !== instance);
  }

  public getStoredInstance(): Instance | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem(this.storedInstanceKey);
    if (stored !== null) {
      return JSON.parse(stored);
    }

    return null;
  }

  public get lemmyPassword(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage.getItem(this.lemmyPasswordKey);
  }

  public set lemmyPassword(password: string) {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(this.lemmyPasswordKey, password);
  }

  public setStoredInstance(instance: Instance): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.storedInstanceKey, JSON.stringify(instance));
  }

  public removeStoredInstance(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.storedInstanceKey);
  }

  public get mastodonSynchronizationSettings(): MastodonSynchronizationSettings {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.mastodonSynchronizationSettingsKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }

    return {
      purge: false,
      mode: SynchronizationMode.Own,
      customInstances: [],
      filterByReasons: false,
      reasonsFilter: [],
      includeHesitations: false,
      ignoreInstanceList: [],
      ignoreInstances: false,
      reasonsPublic: false,
      censuresMode: MastodonBlacklistSeverity.Suspend,
      hesitationsMode: MastodonBlacklistSeverity.Silence,
    };
  }

  public set mastodonSynchronizationSettings(settings: MastodonSynchronizationSettings) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.mastodonSynchronizationSettingsKey, JSON.stringify(settings));
  }

  public get lemmySynchronizationSettings(): LemmySynchronizationSettings {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.lemmySynchronizationSettingsKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }

    return {
      username: '',
      purge: false,
      mode: SynchronizationMode.Own,
      customInstances: [],
      filterByReasons: false,
      reasonsFilter: [],
      includeHesitations: false,
      ignoreInstanceList: [],
      ignoreInstances: false,
    };
  }

  public set lemmySynchronizationSettings(settings: LemmySynchronizationSettings) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.lemmySynchronizationSettingsKey, JSON.stringify(settings));
  }

  public get censureListFilters(): CensureListFilters {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.censureListFiltersKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
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
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.censureListFiltersKey, JSON.stringify(filters));
  }
}
