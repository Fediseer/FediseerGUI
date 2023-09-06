import {Component, OnInit} from '@angular/core';
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {Instance} from "../../../user/instance";
import {TitleService} from "../../../services/title.service";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {toPromise} from "../../../types/resolvable";
import {SuccessResponse} from "../../../response/success.response";

@Component({
  selector: 'app-blacklisted-instances',
  templateUrl: './blacklisted-instances.component.html',
  styleUrls: ['./blacklisted-instances.component.scss']
})
export class BlacklistedInstancesComponent implements OnInit {
  private readonly perPage = 30;

  private allInstances: InstanceDetailResponse[] = [];

  public instances: InstanceDetailResponse[] = [];
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;
  public censoredByMe: string[] = [];
  public maxPage = 1;
  public currentPage = 1;
  public pages: number[] = [];

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authManager: AuthenticationManagerService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Blacklisted instances';

    if (!this.currentInstance.anonymous) {
      const response = await toPromise(this.api.getCensuresByInstances([this.currentInstance.name]));
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }
      this.censoredByMe = response.successResponse!.instances.map(instance => instance.domain);
    }

    const response = await toPromise(this.api.getBlacklistedInstances());
    if (!response.success) {
      this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
      return;
    }
    this.allInstances = response.successResponse!.instances;
    this.maxPage = Math.ceil(this.allInstances.length / this.perPage);
    for (let i = 1; i <= this.maxPage; ++i) {
      this.pages.push(i);
    }

    this.activatedRoute.queryParams.subscribe(query => {
      this.currentPage = query['page'] ? Number(query['page']) : 1;
      this.instances = this.allInstances.slice((this.currentPage - 1) * this.perPage, this.currentPage * this.perPage);
    });
  }

  public async toggleCensure(instance: string): Promise<void> {
    const censored: boolean = this.censoredByMe.indexOf(instance) > -1;
    if (censored) {
      const response: ApiResponse<SuccessResponse> = await toPromise(this.api.cancelCensure(instance));
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }
    } else {
      await this.router.navigateByUrl(`/censures/censor?instance=${instance}`);
      return;
    }

    if (censored) {
      this.censoredByMe = this.censoredByMe.filter(endorsedInstance => endorsedInstance !== instance);
    }
  }

  public async goToPage(page: number): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
  }
}
