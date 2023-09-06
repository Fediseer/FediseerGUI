import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {toPromise} from "../../../types/resolvable";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {Instance} from "../../../user/instance";
import {SuccessResponse} from "../../../response/success.response";

@Component({
  selector: 'app-whitelisted-instances',
  templateUrl: './whitelisted-instances.component.html',
  styleUrls: ['./whitelisted-instances.component.scss']
})
export class WhitelistedInstancesComponent implements OnInit {
  private readonly perPage = 30;

  private allInstances: InstanceDetailResponse[] = [];

  public instances: InstanceDetailResponse[] = [];
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;
  public endorsedByMe: string[] = [];
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
    this.titleService.title = 'Whitelisted instances';

    if (!this.currentInstance.anonymous) {
      const response = await toPromise(this.api.getEndorsementsByInstance([this.currentInstance.name]));
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }
      this.endorsedByMe = response.successResponse!.instances.map(instance => instance.domain);
    }

    const response = await toPromise(this.api.getWhitelistedInstances());
    if (!response.success) {
      this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
      return;
    }
    this.allInstances = response.successResponse!.instances.sort((a, b) => {
      if (a.endorsements === b.endorsements) {
        return 0;
      }

      return a.endorsements > b.endorsements ? -1 : 1;
    });
    this.maxPage = Math.ceil(this.allInstances.length / this.perPage);
    for (let i = 1; i <= this.maxPage; ++i) {
      this.pages.push(i);
    }

    this.activatedRoute.queryParams.subscribe(query => {
      this.currentPage = query['page'] ? Number(query['page']) : 1;
      this.instances = this.allInstances.slice((this.currentPage - 1) * this.perPage, this.currentPage * this.perPage);
    });
  }

  public async toggleEndorse(instance: string): Promise<void> {
    const endorsed: boolean = this.endorsedByMe.indexOf(instance) > -1;
    let response: ApiResponse<SuccessResponse>;
    if (endorsed) {
      response = await toPromise(this.api.cancelEndorsement(instance));
    } else {
      response = await toPromise(this.api.endorseInstance(instance));
    }

    if (!response.success) {
      this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
      return;
    }

    if (endorsed) {
      this.endorsedByMe = this.endorsedByMe.filter(endorsedInstance => endorsedInstance !== instance);
    } else {
      this.endorsedByMe.push(instance);
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
