import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../../services/database.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {LemmyApiService} from "../../../services/lemmy-api.service";
import {toPromise} from "../../../types/resolvable";
import {debounceTime, map} from "rxjs";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {MessageService} from "../../../services/message.service";
import {HttpErrorResponse} from "@angular/common/http";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {SynchronizationMode} from "../../../types/synchronization-mode";
import {
  FilterFormResult,
  GetSettingsCallback,
  SaveSettingsCallback
} from "../../components/filter-form/filter-form.component";
import {LemmySynchronizationSettings} from "../../../types/lemmy-synchronization-settings";
import {NewToStringCallback} from "../../components/blacklist-diff/blacklist-diff.component";
import {SuccessResponse} from "../../../response/success.response";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-synchronize',
  templateUrl: './synchronize-lemmy.component.html',
  styleUrls: ['./synchronize-lemmy.component.scss']
})
export class SynchronizeLemmyComponent implements OnInit {
  public form = new FormGroup({
    instance: new FormControl<string>('', [Validators.required]),
    username: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [Validators.required]),
    totp: new FormControl<string | null>(null),
  });

  public loading = true;
  public loadingPreview = false;
  public loadingPreviewLemmyToFediseer = true;

  public currentMode: SynchronizationMode | null = null;
  public purgeMode: boolean | null = null;
  public originallyBlockedInstances: string[] = [];
  public sourceBlockedInstances: string[] = [];
  public myCensuredInstances: string[] = [];
  public instancesToBanPreview: InstanceDetailResponse[] | null = null;

  public lemmyToFediseerSyncNewListCallback: NewToStringCallback<string>  = instance => instance;

  public saveSettingsCallback: SaveSettingsCallback<LemmySynchronizationSettings> = (database, settings) => {
    database.lemmySynchronizationSettings = settings;
  }
  public getSettingsCallback: GetSettingsCallback<LemmySynchronizationSettings> = database => {
    return database.lemmySynchronizationSettings;
  }

  constructor(
    private readonly database: DatabaseService,
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly lemmyApi: LemmyApiService,
    private readonly fediseerApi: FediseerApiService,
    private readonly cachedFediseerApi: CachedFediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Blacklist synchronization - Lemmy';

    const settings = this.database.lemmySynchronizationSettings;
    this.form.patchValue({
      username: settings.username,
      instance: this.authManager.currentInstanceSnapshot.name,
      password: this.database.lemmyPassword ?? '',
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
    this.loadingPreviewLemmyToFediseer = false;

    this.form.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(values => {
      this.database.lemmyPassword = values.password ?? '';
      const settings = this.database.lemmySynchronizationSettings;
      settings.username = values.username ?? '';
      this.database.lemmySynchronizationSettings = settings;
    });
  }

  public async loadDiffs(instancesToBan: FilterFormResult): Promise<void> {
    if (this.currentMode === null) {
      return;
    }
    this.instancesToBanPreview = instancesToBan.all;
    this.loadingPreview = false;
  }

  private async getJwt(): Promise<string | null> {
    try {
      return  await toPromise(this.lemmyApi.login(
        this.form.controls.instance.value!,
        this.form.controls.username.value!,
        this.form.controls.password.value!,
        this.form.controls.totp.value,
      ));
    } catch (e) {
      const error = (<HttpErrorResponse>e).error.error;
      switch (error) {
        case 'missing_totp_token':
          this.messageService.createError(`You're missing the TOTP token.`);
          break;
        case 'incorrect_totp token':
          this.messageService.createError('The TOTP token is incorrect.');
          break;
        case 'incorrect_login':
          this.messageService.createError('Wrong username/email or password.');
          break;
        default:
          this.messageService.createError(`There was an error: ${error}`);
          break;
      }
      return null;
    }
  }

  private async isAdmin(instance: string, jwt: string): Promise<boolean | null> {
    try {
      if (!await toPromise(this.lemmyApi.isCurrentUserAdmin(instance, jwt))) {
        this.messageService.createError(`Your user is not an admin of ${instance}`);
        return false;
      }

      return true;
    } catch (e) {
      const error = (<HttpErrorResponse>e).error.error;
      this.messageService.createError(`There was an error: ${error}`);
      return null;
    }
  }

  private async getEndorsedCensureChain(instance: string): Promise<string[]> {
    return await toPromise(this.fediseerApi.getEndorsementsByInstance([instance]).pipe(
      map(response => {
        if (this.apiResponseHelper.handleErrors([response])) {
          return [];
        }

        return response.successResponse!.instances.map(instance => instance.domain);
      }),
    ));
  }

  private async getBlockedInstancesFromSource(instance: string): Promise<string[] | null> {
    try {
      return await toPromise(this.lemmyApi.getBlockedInstances(instance));
    } catch (e) {
      const error = (<HttpErrorResponse>e).error.error;
      this.messageService.createError(`There was an error: ${error}`);
      return null;
    }
  }

  public async synchronizeToLemmy(instancesToBan: FilterFormResult): Promise<void> {
    try {
      if (this.purgeMode === null) {
        this.messageService.createError('There was an error with submitting the form.');
        return;
      }
      if (!this.form.valid) {
        this.messageService.createError('The form is not filled correctly.');
        return;
      }

      this.loading = true;
      const myInstance = this.authManager.currentInstanceSnapshot.name;

      const jwt = await this.getJwt();
      if (jwt === null) {
        return;
      }
      if (!await this.isAdmin(myInstance, jwt)) {
        return;
      }

      const originalInstances = await this.getBlockedInstancesFromSource(myInstance);
      if (originalInstances === null) {
        this.messageService.createError('Failed to fetch list of original instances.');
        return;
      }

      const newInstances =
        this.purgeMode
          ? instancesToBan.all.map(instance => instance.domain)
          : [...new Set([...originalInstances, ...instancesToBan.all.map(instance => instance.domain)])]
      ;

      try {
        await toPromise(this.lemmyApi.updateBlacklist(myInstance, jwt, newInstances));
      } catch (e) {
        const error = (<HttpErrorResponse>e).error.error;
        this.messageService.createError(`There was an error: ${error}`);
        return;
      }

      this.messageService.createSuccess('The list was successfully synchronized');

      const newBlockedInstances = await this.getBlockedInstancesFromSource(this.authManager.currentInstanceSnapshot.name);
      if (newBlockedInstances === null) {
        this.messageService.createError('Failed to fetch the updated list from your instance, please refresh the page');
      } else {
        this.sourceBlockedInstances = newBlockedInstances;
      }
    } finally {
      this.loading = false;
    }
  }

  public async synchronizeFromLemmy(): Promise<void> {
    this.loading = true;

    const myInstance = this.authManager.currentInstanceSnapshot.name;

    const jwt = await this.getJwt();
    if (jwt === null) {
      return;
    }
    if (!await this.isAdmin(myInstance, jwt)) {
      return;
    }

    const instances = this.sourceBlockedInstances.filter(
      instance => !this.myCensuredInstances.includes(instance),
    );

    const promises: Promise<ApiResponse<SuccessResponse>>[] = [];
    for (const instance of instances) {
      promises.push(toPromise(this.fediseerApi.censureInstance(instance, null)));
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

    this.messageService.createSuccess('Your Lemmy blocklist was successfully synchronized to Fediseer. Please add reasons to the newly imported censures to help your fellow admins.');
    this.loading = false;
  }
}
