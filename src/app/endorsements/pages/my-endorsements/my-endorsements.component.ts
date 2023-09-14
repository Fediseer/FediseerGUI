import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {MessageService} from "../../../services/message.service";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";
import {toObservable, toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";

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
    private readonly messageService: MessageService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = `My endorsements`;

    const responses = await Promise.all([
      toPromise(this.api.getEndorsementsForInstance(this.authManager.currentInstanceSnapshot.name)),
      toPromise(this.api.getEndorsementsByInstance([this.authManager.currentInstanceSnapshot.name])),
      toPromise(this.api.getCurrentInstanceInfo()),
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
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.endorsementsByMyInstance = this.endorsementsByMyInstance.filter(
        endorsedInstance => endorsedInstance.domain !== instance,
      );
    });
  }
}
