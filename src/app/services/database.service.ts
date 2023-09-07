import {Injectable} from '@angular/core';
import {Instance} from "../user/instance";
import {SynchronizationMode, SynchronizeSettings} from "../types/synchronize-settings";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly storedInstanceKey = 'instance';
  private readonly lemmySynchronizationSettingsKey = 'sync_settings_lemmy';
  private readonly lemmyPasswordKey = 'lemmy_password';

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
    };
  }

  public setLemmySynchronizationSettings(settings: SynchronizeSettings): void {
    localStorage.setItem(this.lemmySynchronizationSettingsKey, JSON.stringify(settings));
  }
}
