import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../../services/database.service";
import {TitleService} from "../../../services/title.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MastodonSynchronizationSettings} from "../../../types/mastodon-synchronization-settings";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {getMastodonRedirectUri, mastodonScopes} from "../mastodon-oauth-callback/mastodon-oauth-callback.component";
import {MastodonApiService} from "../../../services/mastodon-api.service";
import {toPromise} from "../../../types/resolvable";
import {MastodonBlacklistItem, MastodonBlacklistSeverity} from "../../../response/mastodon-blacklist.response";
import {MessageService} from "../../../services/message.service";
import {
  FilterFormResult,
  GetSettingsCallback,
  SaveSettingsCallback
} from "../../components/filter-form/filter-form.component";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {SynchronizationMode} from "../../../types/synchronization-mode";
import {OriginalToStringCallback} from "../../components/blacklist-diff/blacklist-diff.component";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";

@Component({
  selector: 'app-synchronize-mastodon',
  templateUrl: './synchronize-mastodon.component.html',
  styleUrls: ['./synchronize-mastodon.component.scss']
})
export class SynchronizeMastodonComponent implements OnInit {
  protected readonly currentInstance = this.authManager.currentInstanceSnapshot.name;

  private syncSettings: MastodonSynchronizationSettings = this.database.mastodonSynchronizationSettings;

  public oauthForm = new FormGroup({
    clientId: new FormControl<string>('', [Validators.required]),
    secret: new FormControl<string>('', [Validators.required]),
  });

  public form = new FormGroup({
    reasonsPublic: new FormControl<boolean>(false),
  });

  public originallyBlockedInstances: MastodonBlacklistItem[] = [];

  public loading: boolean = true;
  public oauthSetupFinished: boolean = true;

  public currentMode: SynchronizationMode | null = null;
  public loadingPreview: boolean = true;
  public purgeMode: boolean | null = null;
  public instancesToBanPreview: InstanceDetailResponse[] | null = null;

  public saveSettingsCallback: SaveSettingsCallback<MastodonSynchronizationSettings> = (database, settings) => {
    database.mastodonSynchronizationSettings = settings;
  }
  public getSettingsCallback: GetSettingsCallback<MastodonSynchronizationSettings> = database => {
    return database.mastodonSynchronizationSettings;
  }
  public instanceToStringCallback: OriginalToStringCallback<MastodonBlacklistItem> = instance => instance.domain;

  constructor(
    private readonly database: DatabaseService,
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly mastodonApi: MastodonApiService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Blacklist synchronization - Mastodon';

    if (!this.syncSettings.oauthToken && (!this.syncSettings.oauthClientId || !this.syncSettings.oauthClientSecret)) {
      this.oauthForm.patchValue({
        clientId: this.syncSettings.oauthClientId ?? '',
        secret: this.syncSettings.oauthClientSecret ?? '',
      });
      this.oauthSetupFinished = false;
      this.loading = false;
      return;
    }

    if (!this.syncSettings.oauthToken) {
      this.oauthSetupFinished = false;
      await this.oauthRedirect();
      return;
    }

    this.form.patchValue({
      reasonsPublic: this.syncSettings.reasonsPublic,
    });

    this.form.valueChanges.subscribe(changes => {
      // this is done as an assignment to a new object because typescript won't let you compile if you miss any
      this.database.mastodonSynchronizationSettings = {
        oauthClientId: this.syncSettings.oauthClientId,
        oauthClientSecret: this.syncSettings.oauthClientSecret,
        purge: this.syncSettings.purge,
        filterByReasons: this.syncSettings.filterByReasons,
        customInstances: this.syncSettings.customInstances,
        ignoreInstanceList: this.syncSettings.ignoreInstanceList,
        ignoreInstances: this.syncSettings.ignoreInstances,
        reasonsFilter: this.syncSettings.reasonsFilter,
        includeHesitations: this.syncSettings.includeHesitations,
        mode: this.syncSettings.mode,
        oauthToken: this.syncSettings.oauthToken,
        // custom fields
        reasonsPublic: this.form.controls.reasonsPublic.value ?? false,
      }
    });

    const instances = await this.getBlockedInstancesFromSource(this.authManager.currentInstanceSnapshot.name);
    this.loading = false;
    if (instances === null) {
      this.messageService.createError('Failed getting the original blocked instance list.');
      return;
    }
    this.originallyBlockedInstances = instances;
  }

  public async saveOauth(): Promise<void> {
    const settings = this.database.mastodonSynchronizationSettings;
    settings.oauthClientId = this.oauthForm.controls.clientId.value ?? undefined;
    settings.oauthClientSecret = this.oauthForm.controls.secret.value ?? undefined;
    this.database.mastodonSynchronizationSettings = settings;
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

  private async getBlockedInstancesFromSource(instance: string): Promise<MastodonBlacklistItem[] | null> {
    try {
      return await toPromise(this.mastodonApi.getBlacklist(instance, this.syncSettings.oauthToken!));
    } catch (e) {
      return null;
    }
  }

  public async synchronize(instancesToBan: FilterFormResult): Promise<void> {
    if (this.purgeMode === null) {
      this.messageService.createError('There was an error with submitting the form.');
      return;
    }

    this.loading = true;

    const myInstance = this.authManager.currentInstanceSnapshot.name;
    const originalInstances = await this.getBlockedInstancesFromSource(myInstance);
    if (originalInstances === null) {
      this.loading = false;
      this.messageService.createError('Failed to fetch list of original instances.');
      return;
    }

    const instancesToBanString = instancesToBan.all.map(instance => instance.domain);
    const originalInstancesString = originalInstances.map(instance => instance.domain);

    const toRemove = this.purgeMode
      ? originalInstances.filter(instance => !instancesToBanString.includes(instance.domain))
      : [];
    const toAdd = instancesToBan.all
      .filter(instance => !originalInstancesString.includes(instance.domain))
      .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance))
    ;

    const token = this.syncSettings.oauthToken!;
    const responses: Promise<any>[] = [];

    for (const item of toRemove) {
      responses.push(toPromise(this.mastodonApi.deleteBlacklist(myInstance, token, item.id)));
    }
    for (const item of toAdd) {
      const reasons = [
        ...item.censureReasons,
        ...item.hesitationReasons,
      ].join(', ');
      responses.push(toPromise(this.mastodonApi.blacklistInstance(myInstance, token, item.domain, {
        severity: MastodonBlacklistSeverity.Suspend,
        private_comment: reasons,
        public_comment: this.form.controls.reasonsPublic.value ? reasons : undefined,
      })));
    }

    try {
      await Promise.all(responses);
      this.messageService.createSuccess('The blacklist was successfully updated.');
    } catch (e) {
      this.messageService.createError('Failed to update the blacklist.')
    }
    this.loading = false;
  }

  public async loadDiffs(instancesToBan: InstanceDetailResponse[]): Promise<void> {
    if (this.currentMode === null) {
      return;
    }
    this.instancesToBanPreview = instancesToBan;
    this.loadingPreview = false;
  }
}
