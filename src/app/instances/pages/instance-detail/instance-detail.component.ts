import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ActivatedRoute, Router} from "@angular/router";
import {toPromise} from "../../../types/resolvable";
import {MessageService} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {InstanceListResponse} from "../../../response/instance-list.response";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";

@Component({
  selector: 'app-instance-detail',
  templateUrl: './instance-detail.component.html',
  styleUrls: ['./instance-detail.component.scss']
})
export class InstanceDetailComponent implements OnInit {
  public censuresReceived: NormalizedInstanceDetailResponse[] = [];
  public censuresGiven: NormalizedInstanceDetailResponse[] = [];
  public endorsementsReceived: InstanceDetailResponse[] = [];
  public endorsementsGiven: InstanceDetailResponse[] = [];
  public guaranteesGiven: InstanceDetailResponse[] = [];
  public detail: InstanceDetailResponse | null = null;
  public loading: boolean = true;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      this.loading = true;

      this.censuresReceived = [];
      this.censuresGiven = [];
      this.endorsementsReceived = [];
      this.endorsementsGiven = [];
      this.guaranteesGiven = [];
      this.detail = null;

      const instanceDomain = <string>params['instance'];
      this.titleService.title = `${instanceDomain} | Instance detail`;

      const map = {
        censuresReceived: 0,
        censuresGiven: 1,
        endorsementsReceived: 2,
        endorsementsGiven: 3,
        guaranteesGiven: 4,
        detail: 5,
      };
      const promises = [
        toPromise(this.api.getCensuresForInstance(instanceDomain)),
        toPromise(this.api.getCensuresByInstances([instanceDomain])),
        toPromise(this.api.getEndorsementsForInstance(instanceDomain)),
        toPromise(this.api.getEndorsementsByInstance([instanceDomain])),
        toPromise(this.api.getGuaranteesByInstance(instanceDomain)),
        toPromise(this.api.getInstanceInfo(instanceDomain)),
      ];

      const responses = await Promise.all(promises);
      if (this.apiResponseHelper.handleErrors(responses)) {
        this.loading = false;
        return;
      }

      this.censuresReceived = (<InstanceListResponse<InstanceDetailResponse>>responses[map.censuresReceived].successResponse).instances
        .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
      this.censuresGiven = (<InstanceListResponse<InstanceDetailResponse>>responses[map.censuresGiven].successResponse).instances
        .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
      this.endorsementsReceived = (<InstanceListResponse<InstanceDetailResponse>>responses[map.endorsementsReceived].successResponse).instances;
      this.endorsementsGiven = (<InstanceListResponse<InstanceDetailResponse>>responses[map.endorsementsGiven].successResponse).instances;
      this.guaranteesGiven = (<InstanceListResponse<InstanceDetailResponse>>responses[map.guaranteesGiven].successResponse).instances;
      this.detail = <InstanceDetailResponse>responses[map.detail].successResponse;

      this.loading = false;
    });
  }
}
