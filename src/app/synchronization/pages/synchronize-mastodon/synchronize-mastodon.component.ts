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
import {NewToStringCallback, OriginalToStringCallback} from "../../components/blacklist-diff/blacklist-diff.component";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {SuccessResponse} from "../../../response/success.response";

@Component({
  selector: 'app-synchronize-mastodon',
  templateUrl: './synchronize-mastodon.component.html',
  styleUrls: ['./synchronize-mastodon.component.scss']
})
export class SynchronizeMastodonComponent implements OnInit {
  protected readonly MastodonBlacklistSeverity = MastodonBlacklistSeverity;
  protected readonly currentInstance = this.authManager.currentInstanceSnapshot.name;
  protected readonly mastodonToFediseerSyncNewListCallback: NewToStringCallback<MastodonBlacklistItem>  = instance => instance.domain;

  private syncSettings: MastodonSynchronizationSettings = this.database.mastodonSynchronizationSettings;

  public oauthForm = new FormGroup({
    clientId: new FormControl<string>('', [Validators.required]),
    secret: new FormControl<string>('', [Validators.required]),
  });

  public form = new FormGroup({
    reasonsPublic: new FormControl<boolean>(false),
    censuresMode: new FormControl<MastodonBlacklistSeverity>(MastodonBlacklistSeverity.Suspend),
    hesitationsMode: new FormControl<MastodonBlacklistSeverity>(MastodonBlacklistSeverity.Silence),
  });

  public originallyBlockedInstances: MastodonBlacklistItem[] = [];
  public sourceBlockedInstances: MastodonBlacklistItem[] = [];

  public loading: boolean = true;
  public oauthSetupFinished: boolean = true;

  public currentMode: SynchronizationMode | null = null;
  public loadingPreview: boolean = true;
  public purgeMode: boolean | null = null;
  public instancesToBanPreview: InstanceDetailResponse[] | null = null;
  public myCensuredInstances: string[] = [];

  public saveSettingsCallback: SaveSettingsCallback<MastodonSynchronizationSettings> = (database, settings) => {
    database.mastodonSynchronizationSettings = settings;
  }
  public getSettingsCallback: GetSettingsCallback<MastodonSynchronizationSettings> = database => {
    return database.mastodonSynchronizationSettings;
  }
  public instanceToStringCallback: OriginalToStringCallback<MastodonBlacklistItem> = instance => instance.domain;
  public loadingPreviewMastodonToFediseer: boolean = true;

  constructor(
    private readonly database: DatabaseService,
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly mastodonApi: MastodonApiService,
    private readonly messageService: MessageService,
    private readonly cachedFediseerApi: CachedFediseerApiService,
    private readonly fediseerApi: FediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
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
      hesitationsMode: this.syncSettings.hesitationsMode,
      censuresMode: this.syncSettings.censuresMode,
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
        censuresMode: this.form.controls.censuresMode.value ?? MastodonBlacklistSeverity.Suspend,
        hesitationsMode: this.form.controls.hesitationsMode.value ?? MastodonBlacklistSeverity.Silence,
      }
    });

    const instances = await this.getBlockedInstancesFromSource(this.authManager.currentInstanceSnapshot.name);
    this.loading = false;
    if (instances === null) {
      this.messageService.createError('Failed getting the original blocked instance list.');
      return;
    }
    this.originallyBlockedInstances = instances;
    this.sourceBlockedInstances = instances;

    const myCensures = await toPromise(this.cachedFediseerApi.getCensuresByInstances([
      this.authManager.currentInstanceSnapshot.name,
    ], {ttl: 10}));
    if (this.apiResponseHelper.handleErrors([myCensures])) {
      return;
    }
    this.myCensuredInstances = myCensures.successResponse!.instances.map(instance => instance.domain);
    this.loadingPreviewMastodonToFediseer = false;
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

  public async synchronize(filterFormResult: FilterFormResult): Promise<void> {
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

    const originalInstancesString = originalInstances.map(instance => instance.domain);

    let censuredInstances: NormalizedInstanceDetailResponse[] = [];
    let hesitatedInstances: NormalizedInstanceDetailResponse[] = [];
    let instancesToRemove: MastodonBlacklistItem[] = [];

    if (filterFormResult.includeHesitationsAsCensures) {
      censuredInstances = filterFormResult.all
        .filter(instance => !originalInstancesString.includes(instance.domain))
        .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
    } else {
      censuredInstances = filterFormResult.censured
        .filter(instance => !originalInstancesString.includes(instance.domain))
        .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
      hesitatedInstances = filterFormResult.hesitated
        .filter(instance => !originalInstancesString.includes(instance.domain))
        .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
    }
    const instancesToBanString = [...filterFormResult.censured, ...filterFormResult.hesitated].map(instance => instance.domain);

    if (this.purgeMode) {
      instancesToRemove = originalInstances
        .filter(instance => !instancesToBanString.includes(instance.domain))
      ;
    }

    const token = this.syncSettings.oauthToken!;
    const responses: Promise<any>[] = [];

    for (const item of instancesToRemove) {
      responses.push(toPromise(this.mastodonApi.deleteBlacklist(myInstance, token, item.id)));
    }
    for (const item of censuredInstances) {
      const severity = this.form.controls.censuresMode.value ?? MastodonBlacklistSeverity.Suspend;
      if (severity === MastodonBlacklistSeverity.Nothing) {
        break;
      }
      const reasons = [
        ...item.censureReasons,
        ...item.hesitationReasons,
      ].join(', ');
      responses.push(toPromise(this.mastodonApi.blacklistInstance(myInstance, token, item.domain, {
        severity: severity,
        private_comment: reasons,
        public_comment: this.form.controls.reasonsPublic.value ? reasons : undefined,
      })));
    }
    for (const item of hesitatedInstances) {
      const severity = this.form.controls.hesitationsMode.value ?? MastodonBlacklistSeverity.Silence;
      if (severity === MastodonBlacklistSeverity.Nothing) {
        break;
      }
      const reasons = [
        ...item.censureReasons,
        ...item.hesitationReasons,
      ].join(', ');
      responses.push(toPromise(this.mastodonApi.blacklistInstance(myInstance, token, item.domain, {
        severity: severity,
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

    const newBlockedInstances = await this.getBlockedInstancesFromSource(this.authManager.currentInstanceSnapshot.name);
    if (newBlockedInstances === null) {
      this.messageService.createError('Failed to fetch the updated list from your instance, please refresh the page');
    } else {
      this.sourceBlockedInstances = newBlockedInstances;
    }
    this.loading = false;
  }

  public async loadDiffs(instancesToBan: FilterFormResult): Promise<void> {
    if (this.currentMode === null) {
      return;
    }
    this.instancesToBanPreview = [...instancesToBan.censured, ...instancesToBan.hesitated];
    this.loadingPreview = false;
  }

  public async synchronizeFromMastodon() {
    this.loading = true;

    const instances = this.sourceBlockedInstances.filter(
      instance => !this.myCensuredInstances.includes(instance.domain),
    );

    const promises: Promise<ApiResponse<SuccessResponse>>[] = [];
    for (const instance of instances) {
      let reasons: string[] = [];
      if (instance.private_comment) {
        reasons.push(instance.private_comment);
      }
      if (instance.public_comment) {
        reasons.push(instance.public_comment);
      }

      reasons = reasons.join(',').split(',').map(reason => reason.trim().toLowerCase());
      promises.push(toPromise(this.fediseerApi.censureInstance(instance.domain, reasons.length ? reasons.join(',') : null)));
    }

    const responses = await Promise.all(promises);
    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.cachedFediseerApi.getCensuresByInstances(
      [this.authManager.currentInstanceSnapshot.name],
      {clear: true, ttl: 10},
    ).subscribe(response => {
      if (!response.success) {
        this.messageService.createWarning(`Couldn't fetch new list of your censured instances, please reload the page to get fresh data.`);
        return;
      }

      this.myCensuredInstances = response.successResponse!.instances.map(instance => instance.domain);
    });

    this.messageService.createSuccess(`Your Mastodon blocklist was successfully synchronized to Fediseer. Please add reasons to the newly imported censures (if you haven't done so on Mastodon) to help your fellow admins.`);
    this.loading = false;
  }
}
