import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {Instance} from "../../../user/instance";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {toPromise} from "../../../types/resolvable";
import {SuccessResponse} from "../../../response/success.response";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {FormControl, FormGroup} from "@angular/forms";
import {debounceTime} from "rxjs";
import {DatabaseService} from "../../../services/database.service";
import {FilterSpecialValueAllInstances} from "../../../shared/constants";
import {environment} from "../../../../environments/environment";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-censured-instances',
  templateUrl: './censured-instances.component.html',
  styleUrls: ['./censured-instances.component.scss']
})
export class CensuredInstancesComponent implements OnInit {
  private readonly perPage = 30;

  public readonly filterInstanceSpecialValueAll = FilterSpecialValueAllInstances;

  private allInstances: NormalizedInstanceDetailResponse[] = [];

  public instances: NormalizedInstanceDetailResponse[] = [];
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;
  public censuredByMe: string[] = [];
  public maxPage = 1;
  public currentPage = 1;
  public pages: number[] = [];
  public loading: boolean = true;
  public allWhitelistedInstances: InstanceDetailResponse[] = [];

  public filterForm = new FormGroup({
    instances: new FormControl<string[]>(environment.defaultCensuresListInstanceFilter),
    includeEndorsed: new FormControl<boolean>(false),
    includeGuaranteed: new FormControl<boolean>(false),
    recursive: new FormControl<boolean>(true),
    onlyMatching: new FormControl<boolean>(false),
    matchingReasons: new FormControl<string[]>([]),
  });

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly messageService: MessageService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authManager: AuthenticationManagerService,
    private readonly router: Router,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly database: DatabaseService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Censured instances';

    if (!this.currentInstance.anonymous) {
      const response = await toPromise(this.cachedApi.getCensuresByInstances([this.currentInstance.name]));
      if (this.apiResponseHelper.handleErrors([response])) {
        this.loading = false;
        return;
      }
      this.censuredByMe = response.successResponse!.instances.map(instance => instance.domain);
    }

    const allWhitelistedInstancesResponse = await toPromise(this.cachedApi.getWhitelistedInstances());
    if (this.apiResponseHelper.handleErrors([allWhitelistedInstancesResponse])) {
      this.loading = false;
      return;
    }
    this.allWhitelistedInstances = allWhitelistedInstancesResponse.successResponse!.instances;

    const storedFilters = this.database.censureListFilters;
    if (!storedFilters.instances.length) {
      storedFilters.instances = environment.defaultCensuresListInstanceFilter;
    }

    this.filterForm.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(values => {
      this.database.censureListFilters = {
        instances: values.instances ?? environment.defaultCensuresListInstanceFilter,
        includeEndorsed: values.includeEndorsed ?? false,
        includeGuaranteed: values.includeGuaranteed ?? false,
        matchingReasons: values.matchingReasons ?? [],
        onlyMatching: values.onlyMatching ?? false,
        recursive: values.recursive ?? false,
      };
      if (!values.includeGuaranteed && !values.includeEndorsed && !this.filterForm.controls.recursive.disabled) {
        this.filterForm.controls.recursive.disable();
      }
      if ((values.includeGuaranteed || values.includeEndorsed) && this.filterForm.controls.recursive.disabled) {
        this.filterForm.controls.recursive.enable();
      }
    });

    this.filterForm.patchValue({
      instances: storedFilters.instances,
      onlyMatching: storedFilters.onlyMatching,
      matchingReasons: storedFilters.matchingReasons,
      includeGuaranteed: storedFilters.includeGuaranteed,
      includeEndorsed: storedFilters.includeEndorsed,
      recursive: storedFilters.recursive,
    });

    await this.loadInstances(false);

    this.activatedRoute.queryParams.subscribe(query => {
      this.currentPage = query['page'] ? Number(query['page']) : 1;
      this.loadPage();
    });
  }

  public async toggleCensure(instance: string): Promise<void> {
    const censured: boolean = this.censuredByMe.indexOf(instance) > -1;
    if (censured) {
      this.loading = true;
      const response: ApiResponse<SuccessResponse> = await toPromise(this.api.cancelCensure(instance));
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }
    } else {
      await this.router.navigateByUrl(`/censures/censure?instance=${instance}`);
      return;
    }

    if (censured) {
      this.cachedApi.getCensuresByInstances(
        [this.currentInstance.name],
        {clear: true},
      ).subscribe(() => {
        this.censuredByMe = this.censuredByMe.filter(endorsedInstance => endorsedInstance !== instance);
        this.loading = false;
      });
    }
  }

  public async goToPage(page: number): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
  }

  public async loadInstances(redirect: boolean = true): Promise<void> {
    this.loading = true;

    let sourceInstances = this.filterForm.controls.instances.value ?? environment.defaultCensuresListInstanceFilter;
    if (!sourceInstances.length) {
      sourceInstances = environment.defaultCensuresListInstanceFilter;
    }
    if (sourceInstances.indexOf(this.filterInstanceSpecialValueAll) > -1) {
      sourceInstances = this.allWhitelistedInstances.map(instance => instance.domain);
    } else {
      const allInstancesString = this.allWhitelistedInstances.map(instance => instance.domain);
      sourceInstances = sourceInstances.filter(instance => allInstancesString.indexOf(instance) > -1);
      if (this.filterForm.controls.includeEndorsed.value) {
        const endorsedResponse = await toPromise(this.api.getEndorsementsByInstance(sourceInstances));
        if (this.apiResponseHelper.handleErrors([endorsedResponse])) {
          this.loading = false;
          return;
        }
        sourceInstances = [...new Set([
          ...sourceInstances,
          ...endorsedResponse.successResponse!.instances.map(instance => instance.domain)
        ])];
      }
      if (this.filterForm.controls.includeGuaranteed.value) {
        const guaranteed = await Promise.all(sourceInstances.map(async sourceInstance => {
          const guaranteedResponse = await toPromise(this.api.getGuaranteesByInstance(sourceInstance));
          if (this.apiResponseHelper.handleErrors([guaranteedResponse])) {
            this.loading = false;
            return [sourceInstance];
          }
          return [
            sourceInstance,
            ...guaranteedResponse.successResponse!.instances.map(instance => instance.domain),
          ];
        }));

        sourceInstances = [...new Set([
          ...sourceInstances,
          ...(<string[]>guaranteed.flat(Infinity)),
        ])];
      }
    }

    const response = await toPromise(this.cachedApi.getCensuresByInstances(sourceInstances));
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }
    this.allInstances = response.successResponse!.instances.map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance))
      .sort((a, b) => {
        const countA = a.unmergedCensureReasons.length;
        const countB = b.unmergedCensureReasons.length;

        if (countA === countB) {
          return 0;
        }

        return countA > countB ? -1 : 1;
      });
    this.titleService.title = `Censured instances (${this.allInstances.length})`;
    this.maxPage = Math.ceil(this.allInstances.length / this.perPage);
    this.pages = [];
    for (let i = 1; i <= this.maxPage; ++i) {
      this.pages.push(i);
    }
    if (redirect) {
      await this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: {page: 1},
        queryParamsHandling: 'merge',
      });
    }
    await this.loadPage();
    this.loading = false;
  }

  private async loadPage(): Promise<void> {
    this.instances = this.allInstances.slice((this.currentPage - 1) * this.perPage, this.currentPage * this.perPage);
  }
}
