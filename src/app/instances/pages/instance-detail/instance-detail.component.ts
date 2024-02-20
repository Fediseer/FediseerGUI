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
import {ListVisibility} from "../../../types/list-visibility";
import {InstanceMoveEvent} from "../../../shared/components/instance-move-to-list/instance-move-to-list.component";

@Component({
  selector: 'app-instance-detail',
  templateUrl: './instance-detail.component.html',
  styleUrls: ['./instance-detail.component.scss']
})
export class InstanceDetailComponent implements OnInit {
  protected readonly ListVisibility = ListVisibility;

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
  public myInstanceName: string | null = null;
  public myInstanceHasGivenCensure = false;
  public myInstanceHasGivenHesitation = false;
  public loggedIn = !this.authManager.currentInstanceSnapshot.anonymous;

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
        toPromise(this.cachedApi.getAllCensuresByInstances([instanceDomain])),
        toPromise(this.cachedApi.getEndorsementsForInstance(instanceDomain)),
        toPromise(this.cachedApi.getEndorsementsByInstances([instanceDomain])),
        toPromise(this.cachedApi.getGuaranteesByInstance(instanceDomain)),
        toPromise(this.cachedApi.getInstanceInfo(instanceDomain)),
        toPromise(this.api.getHesitationsForInstance(instanceDomain)),
        toPromise(this.cachedApi.getAllHesitationsByInstances([instanceDomain])),
      ]);
      const manuallyHandleableResponse = [
        responses[1],
        responses[3],
        responses[7],
      ];
      const autoHandleResponse = [
        responses[0],
        responses[2],
        responses[4],
        responses[5],
        responses[6],
      ];
      this.apiResponseHelper.handleErrors(autoHandleResponse, MessageType.Warning);

      for (const response of manuallyHandleableResponse) {
        if (response.success || response.statusCode === 403) {
          continue;
        }
        this.apiResponseHelper.handleErrors([response]);
      }

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
      this.myInstanceName = this.authManager.currentInstanceSnapshot.anonymous ? null : this.authManager.currentInstanceSnapshot.name;
      this.hesitationsReceived = responses[6].successResponse!.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      );
      this.hesitationsGiven = responses[7].successResponse?.instances.map(
        instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
      ) ?? null;

      if (this.myInstanceName) {
        this.myInstanceHasGivenCensure = this.censuresReceived !== null
          && this.censuresReceived.filter(detail => detail.domain === this.myInstanceName).length > 0;
        this.myInstanceHasGivenHesitation = this.hesitationsReceived !== null
          && this.hesitationsReceived.filter(detail => detail.domain === this.myInstanceName).length > 0;
      }

      this.loading = false;
    });
  }

  public async onMovingInstanceFailed(event: InstanceMoveEvent) {

  }

  public async onInstanceMoved(event: InstanceMoveEvent) {

  }

  public async removeRebuttal(sourceInstance: string) {
    this.loading = true;

    await toPromise(this.api.removeRebuttal(sourceInstance));
    const responses = await Promise.all([
      toPromise(this.cachedApi.getHesitationsForInstance(this.authManager.currentInstanceSnapshot.name, {clear: true})),
      toPromise(this.cachedApi.getCensuresForInstance(this.authManager.currentInstanceSnapshot.name, {clear: true})),
    ]);
    this.cachedApi.clearHesitationsByInstanceCache(sourceInstance);
    this.cachedApi.clearCensuresByInstanceCache(sourceInstance);

    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.censuresReceived = responses[1].successResponse!.instances.map(
      instance => {
        const result = NormalizedInstanceDetailResponse.fromInstanceDetail(instance);
        if (result.domain === sourceInstance) {
          result.rebuttal = null;
        }

        return result;
      },
    );
    this.hesitationsReceived = responses[0].successResponse!.instances.map(
      instance => {
        const result = NormalizedInstanceDetailResponse.fromInstanceDetail(instance);
        if (result.domain === sourceInstance) {
          result.rebuttal = null;
        }

        return result;
      },
    );
    this.loading = false;
  }
}
