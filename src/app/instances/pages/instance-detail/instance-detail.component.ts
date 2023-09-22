import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ActivatedRoute, Router} from "@angular/router";
import {toPromise} from "../../../types/resolvable";
import {MessageService, MessageType} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-instance-detail',
  templateUrl: './instance-detail.component.html',
  styleUrls: ['./instance-detail.component.scss']
})
export class InstanceDetailComponent implements OnInit {
  public censuresReceived: NormalizedInstanceDetailResponse[] | null = null;
  public censuresGiven: NormalizedInstanceDetailResponse[] | null = null;
  public hesitationsReceived: NormalizedInstanceDetailResponse[] | null = null;
  public hesitationsGiven: NormalizedInstanceDetailResponse[] | null = null;
  public endorsementsReceived: NormalizedInstanceDetailResponse[] | null = null;
  public endorsementsGiven: NormalizedInstanceDetailResponse[] | null = null;
  public guaranteesGiven: InstanceDetailResponse[] | null = null;
  public detail: InstanceDetailResponse | null = null;

  public loading: boolean = true;
  public myInstance: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
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

      const responses = await Promise.all([
        toPromise(this.api.getCensuresForInstance(instanceDomain)),
        toPromise(this.cachedApi.getCensuresByInstances([instanceDomain])),
        toPromise(this.api.getEndorsementsForInstance(instanceDomain)),
        toPromise(this.api.getEndorsementsByInstance([instanceDomain])),
        toPromise(this.api.getGuaranteesByInstance(instanceDomain)),
        toPromise(this.api.getInstanceInfo(instanceDomain)),
        toPromise(this.api.getHesitationsForInstance(instanceDomain)),
        toPromise(this.api.getHesitationsByInstances([instanceDomain])),
      ]);
      this.apiResponseHelper.handleErrors(responses, MessageType.Warning);

      this.censuresReceived = responses[0].successResponse?.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      ) ?? null;
      this.censuresGiven = responses[1].successResponse?.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      ) ?? null;
      this.endorsementsReceived = responses[2].successResponse?.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      ) ?? null;
      this.endorsementsGiven = responses[3].successResponse?.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      ) ?? null;
      this.guaranteesGiven = responses[4].successResponse?.instances ?? null;
      this.detail = responses[5].successResponse ?? null;
      this.myInstance = !this.authManager.currentInstanceSnapshot.anonymous && this.detail?.domain === this.authManager.currentInstanceSnapshot.name;
      this.hesitationsReceived = responses[6].successResponse!.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      );
      this.hesitationsGiven = responses[7].successResponse?.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      ) ?? null;

      this.loading = false;
    });
  }
}
