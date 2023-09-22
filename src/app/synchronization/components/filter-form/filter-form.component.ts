import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SynchronizationMode} from "../../../types/synchronization-mode";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {toPromise} from "../../../types/resolvable";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {MessageService} from "../../../services/message.service";
import {SynchronizationSettings} from "../../../types/synchronization-settings";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {debounceTime, map, Observable} from "rxjs";
import {DatabaseService} from "../../../services/database.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

export type SaveSettingsCallback<TSettings> = (database: DatabaseService, settings: TSettings) => void;
export type GetSettingsCallback<TSettings> = (database: DatabaseService) => TSettings;

export interface FilterFormResult {
  // always only censured
  censured: InstanceDetailResponse[];
  // always only hesitated
  hesitated: InstanceDetailResponse[];
  // always censured, also includes hesitated if `includeHesitationsAsCensures` is true
  all: InstanceDetailResponse[];
  includeHesitationsAsCensures: boolean;
}

@Component({
  selector: 'app-filter-form',
  templateUrl: './filter-form.component.html',
  styleUrls: ['./filter-form.component.scss']
})
export class FilterFormComponent<TSettings extends SynchronizationSettings> implements OnInit {
  @Input() getSettingsCallback: GetSettingsCallback<TSettings> = () => {throw new Error("getSettingsCallback not provided")};
  @Input() saveSettingsCallback: SaveSettingsCallback<TSettings> = () => {throw new Error("saveSettingsCallback not provided")};

  private _formSubmitted: EventEmitter<FilterFormResult> = new EventEmitter<FilterFormResult>();
  private _modeChanged: EventEmitter<SynchronizationMode> = new EventEmitter<SynchronizationMode>();
  private _instancesToBanChanged: EventEmitter<FilterFormResult> = new EventEmitter<FilterFormResult>();
  private _instancesToBanCalculationStarted: EventEmitter<void> = new EventEmitter<void>();
  private _purgeChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  protected readonly SynchronizationMode = SynchronizationMode;

  private cache: {[key: string]: InstanceDetailResponse[] | null} = {};

  public loadingWhitelistedInstances = false;
  public loadingReasons = false;

  public whitelistedInstancesList: InstanceDetailResponse[] | null = null;
  public availableReasons: string[] | null = null;

  public form = new FormGroup({
    purgeBlacklist: new FormControl<boolean>(false, [Validators.required]),
    mode: new FormControl<SynchronizationMode>(SynchronizationMode.Own, [Validators.required]),
    customInstances: new FormControl<string[]>([]),
    filterByReasons: new FormControl<boolean>(false),
    reasonsFilter: new FormControl<string[]>([]),
    includeHesitations: new FormControl<boolean>(false),
    ignoreInstances: new FormControl<boolean>(false),
    ignoreInstanceList: new FormControl<string[]>([]),
  });

  constructor(
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
    private readonly database: DatabaseService,
  ) {
  }

  @Output() public get formSubmitted(): Observable<FilterFormResult> {
    return this._formSubmitted;
  }

  @Output() public get modeChanged(): Observable<SynchronizationMode> {
    return this._modeChanged;
  }

  @Output() public get instancesToBanChanged(): Observable<FilterFormResult> {
    return this._instancesToBanChanged;
  }

  @Output() public get instancesToBanCalculationStarted(): Observable<void> {
    return this._instancesToBanCalculationStarted;
  }

  @Output() public get purgeChanged(): Observable<boolean> {
    return this._purgeChanged;
  }

  private async getFormResult(): Promise<FilterFormResult | null> {
    const censured = await this.getInstancesToBan(false);
    const hesitated = await this.getInstancesToBan(true);
    const all = await this.getInstancesToBan(null);
    if (censured === null || hesitated === null || all === null) {
      this.messageService.createError('Failed calculating the list of instances to ban.');
      return null;
    }

    return {
      censured: censured,
      hesitated: hesitated,
      all: all,
      includeHesitationsAsCensures: this.form.controls.includeHesitations.value ?? false,
    };
  }

  public async resolveInstanceList(): Promise<void> {
    const result = await this.getFormResult();
    if (result === null) {
      return;
    }
    this._formSubmitted.next(result);
  }

  public async ngOnInit(): Promise<void> {
    const settings = this.getSettingsCallback(this.database);
    this.form.patchValue({
      mode: settings.mode,
      purgeBlacklist: settings.purge,
      filterByReasons: settings.filterByReasons,
      includeHesitations: settings.includeHesitations,
      ignoreInstanceList: settings.ignoreInstanceList,
      ignoreInstances: settings.ignoreInstances,
      reasonsFilter: settings.reasonsFilter,
      customInstances: settings.customInstances,
    });

    this.form.valueChanges.subscribe(changes => {
      this._instancesToBanCalculationStarted.next();

      const settings = this.getSettingsCallback(this.database);

      settings.reasonsFilter = changes.reasonsFilter ?? [];
      settings.mode = changes.mode ?? SynchronizationMode.Own;
      settings.filterByReasons = changes.filterByReasons ?? false;
      settings.purge = changes.purgeBlacklist ?? false;
      settings.customInstances = changes.customInstances ?? [];
      settings.ignoreInstances = changes.ignoreInstances ?? false;
      settings.ignoreInstanceList = changes.ignoreInstanceList ?? [];
      settings.includeHesitations = changes.includeHesitations ?? false;

      this.saveSettingsCallback(this.database, settings);
    });

    this.form.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(changes => {
      this.getFormResult().then(result => {
        if (result === null) {
          return;
        }
        this._instancesToBanChanged.next(result)
      });
    });

    this.form.controls.mode.valueChanges.subscribe(mode => {
      if (mode === null) {
        return;
      }

      this.loadCustomInstancesSelect(mode);
      this._modeChanged.next(mode);
    });
    this.form.controls.purgeBlacklist.valueChanges.subscribe(purge => {
      if (purge === null) {
        return;
      }

      this._purgeChanged.next(purge);
    });
    this.form.controls.filterByReasons.valueChanges.subscribe(filter => {
      if (!filter) {
        return;
      }

      this.loadReasons();
    });

    if (this.form.controls.mode.value) {
      this.loadCustomInstancesSelect(this.form.controls.mode.value);
      this._modeChanged.next(this.form.controls.mode.value);
    }
    if (this.form.controls.purgeBlacklist.value !== null) {
      this._purgeChanged.next(this.form.controls.purgeBlacklist.value);
    }
    if (this.form.controls.filterByReasons.value) {
      this.loadReasons();
    }

    this._instancesToBanCalculationStarted.next();
    this.getFormResult().then(result => {
      if (result === null) {
        return;
      }

      this._instancesToBanChanged.next(result);
    });
  }

  private async loadCustomInstancesSelect(mode: SynchronizationMode) {
    if (this.whitelistedInstancesList === null) {
      this.loadingWhitelistedInstances = true;
      const responses = await Promise.all([
        toPromise(this.cachedApi.getWhitelistedInstances()),
        toPromise(this.api.getEndorsementsByInstance([this.authManager.currentInstanceSnapshot.name])),
        toPromise(this.api.getGuaranteesByInstance(this.authManager.currentInstanceSnapshot.name)),
      ]);

      if (this.apiResponseHelper.handleErrors(responses)) {
        return;
      }

      this.whitelistedInstancesList = responses[0].successResponse!.instances;
      this.loadingWhitelistedInstances = false;
    }
  }

  private async loadReasons() {
    if (this.availableReasons === null) {
      this.loadingReasons = true;
      const reasons = await toPromise(this.api.getUsedReasons());
      if (reasons === null) {
        this.messageService.createError('Failed getting list of reasons from the server');
      }
      this.availableReasons = reasons;
      this.loadingReasons = false;
    }
  }

  private async getInstancesToBan(hesitationsMode: boolean | null = null): Promise<InstanceDetailResponse[] | null> {
    const myInstance = this.authManager.currentInstanceSnapshot.name;
    const mode = this.form.controls.mode.value!;

    let cacheKey: string = mode;
    const myInstanceCacheKey = myInstance + String(Number(this.form.controls.includeHesitations.value)) + String(hesitationsMode);

    if (mode === SynchronizationMode.CustomInstances && this.form.controls.customInstances.value) {
      cacheKey += this.form.controls.customInstances.value.join('|');
    }
    if (this.form.controls.filterByReasons.value && this.form.controls.reasonsFilter.value) {
      cacheKey += this.form.controls.reasonsFilter.value!.join('|');
    }
    if (this.form.controls.ignoreInstances.value && this.form.controls.ignoreInstanceList.value) {
      cacheKey += this.form.controls.ignoreInstanceList.value!.join('|');
    }
    cacheKey += String(Number(this.form.controls.includeHesitations.value));
    cacheKey += String(hesitationsMode);

    this.cache[myInstanceCacheKey] ??= await (async () => {
      const censures = hesitationsMode === true ? [] : await this.getCensuresByInstances([myInstance]);
      const hesitations = hesitationsMode === false || (hesitationsMode === null && !this.form.controls.includeHesitations.value)
        ? []
        : await this.getHesitationsByInstances([myInstance]);

      if (censures === null || hesitations === null) {
        return null;
      }

      return [...censures, ...hesitations];
    })();
    this.cache[`endorsed:${myInstance}`] ??= await (async () => {
      const response = await toPromise(this.api.getEndorsementsByInstance([myInstance]));
      if (this.apiResponseHelper.handleErrors([response])) {
        return [];
      }

      return response.successResponse!.instances;
    })();
    this.cache[cacheKey] ??= await (async () => {
      let sourceFrom: string[];
      switch (mode) {
        case SynchronizationMode.Own:
          sourceFrom = [];
          break;
        case SynchronizationMode.Endorsed:
          sourceFrom = await this.getEndorsedCensureChain(myInstance);
          break;
        case SynchronizationMode.CustomInstances:
          sourceFrom = this.form.controls.customInstances.value ?? [];
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }

      let foreignInstanceBlacklist: InstanceDetailResponse[] = [];
      if (sourceFrom.length) {
        foreignInstanceBlacklist =  await (async () => {
          const censures = hesitationsMode === true ? [] : await this.getCensuresByInstances(sourceFrom);
          const hesitations = hesitationsMode === false || (hesitationsMode === null && !this.form.controls.includeHesitations.value)
            ? []
            : await this.getHesitationsByInstances(sourceFrom);

          if (censures === null || hesitations === null) {
            return [];
          }

          return [...censures, ...hesitations];
        })();
        if (this.form.controls.filterByReasons.value && this.form.controls.reasonsFilter.value) {
          const reasons = this.form.controls.reasonsFilter.value!;
          foreignInstanceBlacklist = foreignInstanceBlacklist.filter(
            instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance).unmergedCensureReasons.filter(
              reason => reasons.includes(reason),
            ).length,
          );
        }
        if (this.form.controls.ignoreInstances.valid && this.form.controls.ignoreInstanceList.value) {
          foreignInstanceBlacklist = foreignInstanceBlacklist.filter(
            instance => !this.form.controls.ignoreInstanceList.value!.includes(instance.domain),
          );
        }
      }

      const myEndorsed = this.cache[`endorsed:${myInstance}`]!.map(instance => instance.domain);
      const result = [...this.cache[myInstanceCacheKey]!, ...foreignInstanceBlacklist];
      const handled: string[] = [];

      return result.filter(instance => {
        if (myEndorsed.includes(instance.domain)) {
          return false;
        }
        if (handled.includes(instance.domain)) {
          return false;
        }

        handled.push(instance.domain);
        return true;
      });
    })();

    return this.cache[cacheKey]!;
  }

  private async getCensuresByInstances(instances: string[]): Promise<InstanceDetailResponse[] | null> {
    const instancesResponse = await toPromise(this.cachedApi.getCensuresByInstances(instances, {ttl: 5}));
    if (this.apiResponseHelper.handleErrors([instancesResponse])) {
      return null;
    }

    return instancesResponse.successResponse!.instances;
  }

  private async getHesitationsByInstances(instances: string[]): Promise<InstanceDetailResponse[] | null> {
    const instancesResponse = await toPromise(this.api.getHesitationsByInstances(instances));
    if (this.apiResponseHelper.handleErrors([instancesResponse])) {
      return null;
    }

    return instancesResponse.successResponse!.instances;
  }

  private async getEndorsedCensureChain(instance: string): Promise<string[]> {
    return await toPromise(this.api.getEndorsementsByInstance([instance]).pipe(
      map(response => {
        if (this.apiResponseHelper.handleErrors([response])) {
          return [];
        }

        return response.successResponse!.instances.map(instance => instance.domain);
      }),
    ));
  }

}
