import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../../services/database.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SynchronizationMode} from "../../../types/synchronize-settings";
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {LemmyApiService} from "../../../services/lemmy-api.service";
import {toPromise} from "../../../types/resolvable";
import {debounceTime, map} from "rxjs";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {MessageService} from "../../../services/message.service";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-synchronize',
  templateUrl: './synchronize-lemmy.component.html',
  styleUrls: ['./synchronize-lemmy.component.scss']
})
export class SynchronizeLemmyComponent implements OnInit {
  protected readonly SynchronizationMode = SynchronizationMode;
  protected readonly Number = Number;

  private cache: {[key: string]: string[] | null} = {};

  public originallyBlockedInstances: string[] = [];

  public form = new FormGroup({
    instance: new FormControl<string>('', [Validators.required]),
    username: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [Validators.required]),
    totp: new FormControl<string | null>(null),
    purgeBlacklist: new FormControl<boolean>(false, [Validators.required]),
    mode: new FormControl<SynchronizationMode>(SynchronizationMode.Own, [Validators.required]),
    customInstances: new FormControl<string[]>([]),
  });
  public loading = true;
  public loadingPreview = false;
  public loadingWhitelistedInstances = false;

  public added: string[] = [];
  public removed: string[] = [];
  public whitelistedInstancesList: string[] | null = null;

  constructor(
    private readonly database: DatabaseService,
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly lemmyApi: LemmyApiService,
    private readonly fediseerApi: FediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Blacklist synchronization - Lemmy';

    const settings = this.database.getLemmySynchronizationSettings();
    this.form.patchValue({
      mode: settings.mode,
      purgeBlacklist: settings.purge,
      username: settings.username,
      instance: this.authManager.currentInstanceSnapshot.name,
      password: this.database.lemmyPassword ?? '',
      customInstances: settings.customInstances,
    });

    const instances = await this.getBlockedInstancesFromSource(this.authManager.currentInstanceSnapshot.name);
    this.loading = false;
    if (instances === null) {
      this.messageService.createError('Failed getting the original blocked instance list.');
      return;
    }
    this.originallyBlockedInstances = instances;

    this.form.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(values => {
      this.database.lemmyPassword = values.password ?? '';
      this.database.setLemmySynchronizationSettings({
        username: values.username ?? '',
        purge: values.purgeBlacklist ?? false,
        mode: values.mode ?? SynchronizationMode.Own,
        customInstances: values.customInstances ?? [],
      });
    });
    this.form.controls.mode.valueChanges.subscribe(mode => {
      if (mode === null) {
        return;
      }
      this.loadDiffs(mode);
      this.loadCustomInstancesSelect(mode);
    });
    this.form.controls.customInstances.valueChanges.subscribe(instances => {
      const mode = this.form.controls.mode.value;
      if (instances === null || mode === null) {
        return;
      }

      this.loadDiffs(mode);
    });
    if (this.form.controls.mode.value) {
      this.loadDiffs(this.form.controls.mode.value);
      this.loadCustomInstancesSelect(this.form.controls.mode.value);
    }
  }

  private async loadCustomInstancesSelect(mode: SynchronizationMode) {
    if (mode === SynchronizationMode.CustomInstances && this.whitelistedInstancesList === null) {
      this.loadingWhitelistedInstances = true;
      const responses = await Promise.all([
        toPromise(this.fediseerApi.getWhitelistedInstances()),
        toPromise(this.fediseerApi.getEndorsementsByInstance([this.authManager.currentInstanceSnapshot.name])),
        toPromise(this.fediseerApi.getGuaranteesByInstance(this.authManager.currentInstanceSnapshot.name)),
      ]);

      if (this.apiResponseHelper.handleErrors(responses)) {
        return;
      }

      const endorsed = responses[1].successResponse!.instances.map(instance => instance.domain);
      const guaranteed = responses[2].successResponse!.instances.map(instance => instance.domain);

      this.whitelistedInstancesList = responses[0].successResponse!.instances
        .map(instance => instance.domain)
        .sort((a, b) => {
          const endorsedA = endorsed.includes(a);
          const endorsedB = endorsed.includes(b);
          const guaranteedA = guaranteed.includes(a);
          const guaranteedB = guaranteed.includes(b);

          if (!endorsedA && !endorsedB && !guaranteedA && !guaranteedB) {
            return 0;
          }

          if (guaranteedA && !guaranteedB) {
            return -1;
          }
          if (guaranteedB && !guaranteedA) {
            return 1;
          }
          if (endorsedA && !endorsedB) {
            return -1;
          }
          if (endorsedB && !endorsedA) {
            return 1;
          }

          return 0;
        });
      this.loadingWhitelistedInstances = false;
    }
  }

  private async loadDiffs(mode: SynchronizationMode) {
    this.loadingPreview = true;
    this.added = [];
    this.removed = [];

    const instancesToBan = await this.getInstancesToBan(mode);
    if (instancesToBan === null) {
      this.loadingPreview = false;
      return;
    }

    this.added = instancesToBan.filter(item => !this.originallyBlockedInstances.includes(item));
    this.removed = this.originallyBlockedInstances.filter(item => !instancesToBan.includes(item));
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
    const result = await toPromise(this.fediseerApi.getEndorsementsByInstance([instance]).pipe(
      map(response => {
        if (this.apiResponseHelper.handleErrors([response])) {
          return [];
        }

        return response.successResponse!.instances.map(instance => instance.domain);
      }),
    ));

    result.push(instance);

    return result;
  }

  private async getCensuresByInstances(instances: string[]): Promise<string[] | null> {
    const instancesResponse = await toPromise(this.fediseerApi.getCensuresByInstances(instances));
    if (this.apiResponseHelper.handleErrors([instancesResponse])) {
      return null;
    }

    return instancesResponse.successResponse!.instances.map(instance => instance.domain);
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

  public async synchronize(): Promise<void> {
    try {
      this.loading = true;

      if (!this.form.valid) {
        this.messageService.createError('The form is not filled correctly.');
        return;
      }
      const myInstance = this.authManager.currentInstanceSnapshot.name;
      const mode = this.form.controls.mode.value!;

      const jwt = await this.getJwt();
      if (jwt === null) {
        return;
      }
      if (!await this.isAdmin(myInstance, jwt)) {
        return;
      }

      const originalInstances = await this.getBlockedInstancesFromSource(myInstance);
      const instancesToBan = await this.getInstancesToBan(mode);
      if (instancesToBan === null || originalInstances === null) {
        return;
      }

      const newInstances = this.form.controls.purgeBlacklist.value! ? instancesToBan : [...new Set([...originalInstances, ...instancesToBan])];

      try {
        await toPromise(this.lemmyApi.updateBlacklist(myInstance, jwt, newInstances));
      } catch (e) {
        const error = (<HttpErrorResponse>e).error.error;
        this.messageService.createError(`There was an error: ${error}`);
        return;
      }

      this.messageService.createSuccess('The list was successfully synchronized');
    } finally {
      this.loading = false;
    }
  }

  private async getInstancesToBan(mode: SynchronizationMode): Promise<string[] | null> {
    const myInstance = this.authManager.currentInstanceSnapshot.name;
    let cacheKey: string = mode;

    if (mode === SynchronizationMode.CustomInstances && this.form.controls.customInstances.value) {
      cacheKey += this.form.controls.customInstances.value.join('|') ?? '';
    }

    this.cache[cacheKey] ??= await (async () => {
      let sourceFrom: string[];
      switch (mode) {
        case SynchronizationMode.Own:
          sourceFrom = [myInstance];
          break;
        case SynchronizationMode.Endorsed:
          sourceFrom = await this.getEndorsedCensureChain(myInstance);
          break;
        case SynchronizationMode.CustomInstances:
          sourceFrom = [myInstance, ...(this.form.controls.customInstances.value ?? [])];
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }

      if (!sourceFrom.length) {
        this.messageService.createError('No instances to get censures from.');
        return [];
      }

      return await this.getCensuresByInstances(sourceFrom);
    })();

    return this.cache[cacheKey]!;
  }
}
