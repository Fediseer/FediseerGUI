import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {toPromise} from "../../../types/resolvable";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {Instance} from "../../../user/instance";
import {SuccessResponse} from "../../../response/success.response";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {SafelistFilter} from "../../../types/safelist-filter";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {int} from "../../../types/number";

@Component({
  selector: 'app-safelisted-instances',
  templateUrl: './safelisted-instances.component.html',
  styleUrls: ['./safelisted-instances.component.scss']
})
export class SafelistedInstancesComponent implements OnInit {
  private readonly perPage = 30;

  private initialLoadComplete: boolean = false;

  public instances: InstanceDetailResponse[] = [];
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;
  public endorsedByMe: string[] = [];
  public maxPage = 1;
  public currentPage: int = 1;
  public lastPageReached = false;
  public pages: number[] = [];
  public loading: boolean = true;
  public loadingFilters: boolean = true;

  public availableTags: string[] = [];

  public form = new FormGroup({
    tags: new FormControl<string[]>([]),
    minimumEndorsements: new FormControl<int>(0, [Validators.min(0)]),
    minimumGuarantors: new FormControl<int>(1, [Validators.min(0)]),
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
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Safelisted instances';

    this.activatedRoute.queryParams.subscribe(async queryParams => {
      this.loading = true;
      this.currentPage = queryParams['page'] ? Number(queryParams['page']) : 1;

      const filters: SafelistFilter = {};
      if (queryParams['tags'] !== undefined) {
        filters.tags = queryParams['tags'].split(',');
      }
      if (queryParams['minimumEndorsements'] !== undefined) {
        filters.minimumEndorsements = Number(queryParams['minimumEndorsements']);
      }
      if (queryParams['minimumGuarantors'] !== undefined) {
        filters.minimumGuarantors = Number(queryParams['minimumGuarantors']);
      }

      const formPatch: SafelistFilter = JSON.parse(JSON.stringify(filters));
      formPatch.tags ??= [];
      formPatch.minimumGuarantors ??= 1;
      formPatch.minimumEndorsements ??= 0;
      this.form.patchValue(formPatch);

      if (!this.currentInstance.anonymous) {
        const response = await toPromise(this.cachedApi.getEndorsementsByInstances([this.currentInstance.name]));
        if (this.apiResponseHelper.handleErrors([response])) {
          this.loading = false;
          return;
        }
        this.endorsedByMe = response.successResponse!.instances.map(instance => instance.domain);
      }

      const response = await toPromise(this.cachedApi.getSafelistedInstances(filters, this.currentPage));
      if (this.apiResponseHelper.handleErrors([response])) {
        this.loading = false;
        return;
      }

      for (let i = 1; i <= this.currentPage; ++i) {
        if (!this.pages.includes(i)) {
          this.pages.push(i);
        }
      }
      this.instances = response.successResponse!.instances;

      if (!this.lastPageReached && this.instances.length === this.api.defaultPerPage && !this.pages.includes(this.currentPage + 1)) {
        this.pages.push(this.currentPage + 1);
      }
      if (this.instances.length !== this.api.defaultPerPage) {
        this.lastPageReached = true;
      }
      this.maxPage = Math.max(...this.pages);

      this.loading = false;

      this.availableTags = await toPromise(this.cachedApi.getAvailableTags());
      this.loadingFilters = false;

      if (!this.initialLoadComplete) {
        this.initialLoadComplete = true;
      }
    });
  }

  public async toggleEndorse(instance: string): Promise<void> {
    this.loading = true;

    const endorsed: boolean = this.endorsedByMe.indexOf(instance) > -1;
    let response: ApiResponse<SuccessResponse>;
    if (endorsed) {
      response = await toPromise(this.api.cancelEndorsement(instance));
    } else {
      response = await toPromise(this.api.endorseInstance(instance));
    }

    this.loading = false;
    if (this.apiResponseHelper.handleErrors([response])) {
      return;
    }

    if (endorsed) {
      this.endorsedByMe = this.endorsedByMe.filter(endorsedInstance => endorsedInstance !== instance);
    } else {
      this.endorsedByMe.push(instance);
    }
    this.cachedApi.getEndorsementsByInstances([this.authManager.currentInstanceSnapshot.name], {clear: true}).subscribe();
  }

  public async goToPage(page: number): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
  }

  public async loadInstances(): Promise<void> {
    if (!this.form.valid) {
      return;
    }

    const queryParams: Params = {
      page: 1,
    };
    if (this.form.controls.tags.value?.length) {
      queryParams['tags'] = this.form.controls.tags.value!.join(',');
    }
    if (this.form.controls.minimumEndorsements.value !== null) {
      queryParams['minimumEndorsements'] = this.form.controls.minimumEndorsements.value!;
    }
    if (this.form.controls.minimumGuarantors.value !== null) {
      queryParams['minimumGuarantors'] = this.form.controls.minimumGuarantors.value!;
    }

    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: queryParams,
    });
  }

  public async submitFilterForm(): Promise<void> {
    this.pages = [];
    this.lastPageReached = false;
    await this.loadInstances();
  }
}
