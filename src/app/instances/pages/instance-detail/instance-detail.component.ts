import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ActivatedRoute, Router} from "@angular/router";
import {toPromise} from "../../../types/resolvable";
import {MessageService} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {InstanceListResponse} from "../../../response/instance-list.response";

@Component({
  selector: 'app-instance-detail',
  templateUrl: './instance-detail.component.html',
  styleUrls: ['./instance-detail.component.scss']
})
export class InstanceDetailComponent implements OnInit {
  public censuresReceived: InstanceDetailResponse[] = [];
  public censuresGiven: InstanceDetailResponse[] = [];
  public endorsementsReceived: InstanceDetailResponse[] = [];
  public endorsementsGiven: InstanceDetailResponse[] = [];
  public guaranteesGiven: InstanceDetailResponse[] = [];
  public detail: InstanceDetailResponse | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
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
      for (const response of responses) {
        if (!response.success) {
          this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
          return;
        }
      }

      this.censuresReceived = (<InstanceListResponse>responses[map.censuresReceived].successResponse).instances;
      this.censuresGiven = (<InstanceListResponse>responses[map.censuresGiven].successResponse).instances;
      this.endorsementsReceived = (<InstanceListResponse>responses[map.endorsementsReceived].successResponse).instances;
      this.endorsementsGiven = (<InstanceListResponse>responses[map.endorsementsGiven].successResponse).instances;
      this.guaranteesGiven = (<InstanceListResponse>responses[map.guaranteesGiven].successResponse).instances;
      this.detail = <InstanceDetailResponse>responses[map.detail].successResponse;
    });
  }
}
