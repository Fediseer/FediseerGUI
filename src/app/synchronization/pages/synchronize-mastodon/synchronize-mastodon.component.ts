import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../../services/database.service";
import {TitleService} from "../../../services/title.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MastodonSynchronizationSettings} from "../../../types/mastodon-synchronization-settings";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {getMastodonRedirectUri, mastodonScopes} from "../mastodon-oauth-callback/mastodon-oauth-callback.component";
import {MastodonApiService} from "../../../services/mastodon-api.service";
import {toPromise} from "../../../types/resolvable";
import {MastodonBlacklistItem} from "../../../response/mastodon-blacklist.response";

@Component({
  selector: 'app-synchronize-mastodon',
  templateUrl: './synchronize-mastodon.component.html',
  styleUrls: ['./synchronize-mastodon.component.scss']
})
export class SynchronizeMastodonComponent implements OnInit {
  private syncSettings: MastodonSynchronizationSettings = this.database.mastodonSynchronizationSettings;

  public oauthForm = new FormGroup({
    clientId: new FormControl<string>('', [Validators.required]),
    secret: new FormControl<string>('', [Validators.required]),
  });

  public originallyBlockedInstances: MastodonBlacklistItem[] = [];

  public loading: boolean = true;
  public oauthSetupFinished: boolean = true;

  constructor(
    private readonly database: DatabaseService,
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly mastodonApi: MastodonApiService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Blacklist synchronization - Mastodon';

    if (!this.syncSettings.oauthClientId || !this.syncSettings.oauthClientSecret) {
      this.oauthForm.patchValue({
        clientId: this.syncSettings.oauthClientId ?? '',
        secret: this.syncSettings.oauthClientSecret ?? '',
      });
      this.oauthSetupFinished = false;
      this.loading = false;
      return;
    }

    if (!this.syncSettings.oauthToken) {
      await this.oauthRedirect();
      return;
    }

    this.originallyBlockedInstances = await this.getBlockedInstancesFromSource(this.authManager.currentInstanceSnapshot.name);
  }

  public async saveOauth(): Promise<void> {
    this.database.mastodonSynchronizationSettings = {
      oauthClientId: this.oauthForm.controls.clientId.value ?? undefined,
      oauthClientSecret: this.oauthForm.controls.secret.value ?? undefined,
      oauthToken: this.syncSettings.oauthToken,
      mode: this.syncSettings.mode,
      purge: this.syncSettings.purge,
      filterByReasons: this.syncSettings.filterByReasons,
      customInstances: this.syncSettings.customInstances,
      ignoreInstanceList: this.syncSettings.ignoreInstanceList,
      ignoreInstances: this.syncSettings.ignoreInstances,
      reasonsFilter: this.syncSettings.reasonsFilter,
      includeHesitations: this.syncSettings.includeHesitations,
    };
    this.syncSettings = this.database.mastodonSynchronizationSettings;
  }

  public async saveOauthAndRedirect(): Promise<void> {
    await this.saveOauth();
    await this.oauthRedirect();
  }

  private async oauthRedirect(): Promise<void> {
    let redirectUri = '';
    if (typeof window !== 'undefined') {
      redirectUri = `${window.location.protocol}//${window.location.host}/synchronize/mastodon/callback`;
    }

    if (typeof window !== 'undefined') {
      window.location.href = `https://${this.authManager.currentInstanceSnapshot.name}/oauth/authorize?client_id=${this.syncSettings.oauthClientId!}&response_type=code&redirect_uri=${redirectUri}&scope=${mastodonScopes.join(' ')}`;
    }
  }

  public get redirectUrl(): string {
    return getMastodonRedirectUri();
  }

  private async getBlockedInstancesFromSource(instance: string): Promise<MastodonBlacklistItem[]> {
    return await toPromise(this.mastodonApi.getBlacklist(instance, this.syncSettings.oauthToken!));
  }
}
