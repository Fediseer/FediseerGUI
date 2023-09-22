import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {TranslatorService} from "../../../services/translator.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-my-endorsements',
  templateUrl: './my-endorsements.component.html',
  styleUrls: ['./my-endorsements.component.scss']
})
export class MyEndorsementsComponent implements OnInit {
  public endorsementsForMyInstance: NormalizedInstanceDetailResponse[] = [];
  public endorsementsByMyInstance: NormalizedInstanceDetailResponse[] = [];
  public instance: Observable<Instance> = this.authManager.currentInstance;
  public guaranteed: boolean = false;
  public loading: boolean = true;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly messageService: MessageService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly translator: TranslatorService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = this.translator.get('app.endorsements.my');

    const responses = await Promise.all([
      toPromise(this.api.getEndorsementsForInstance(this.authManager.currentInstanceSnapshot.name)),
      toPromise(this.api.getEndorsementsByInstance([this.authManager.currentInstanceSnapshot.name])),
      toPromise(this.cachedApi.getCurrentInstanceInfo()),
    ]);

    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.endorsementsForMyInstance = responses[0].successResponse!.instances.map(
      instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
    );
    this.endorsementsByMyInstance = responses[1].successResponse!.instances.map(
      instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance),
    );
    this.guaranteed = responses[2].successResponse!.guarantor !== undefined;
    this.loading = false;
  }

  public async cancelEndorsement(instance: string) {
    this.loading = true;
    this.api.cancelEndorsement(instance).subscribe(response => {
      this.loading = false;
      if (this.apiResponseHelper.handleErrors([response])) {
        return;
      }

      this.endorsementsByMyInstance = this.endorsementsByMyInstance.filter(
        endorsedInstance => endorsedInstance.domain !== instance,
      );
    });
  }
}
