import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";
import {toPromise} from "../../../types/resolvable";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {MessageService} from "../../../services/message.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-my-hesitations',
  templateUrl: './my-hesitations.component.html',
  styleUrls: ['./my-hesitations.component.scss']
})
export class MyHesitationsComponent implements OnInit {
  public loading: boolean = true;
  public instances: NormalizedInstanceDetailResponse[] = [];
  public guaranteed: boolean = false;
  public instance: Observable<Instance> = this.authManager.currentInstance;
  public software: string | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'My hesitations';

    const responses = await Promise.all([
      toPromise(this.api.getHesitationsByInstances([this.authManager.currentInstanceSnapshot.name])),
      toPromise(this.cachedApi.getCurrentInstanceInfo()),
    ]);

    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.instances = responses[0].successResponse!.instances
      .map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
    this.guaranteed = responses[1].successResponse!.guarantor !== undefined;
    this.software = responses[1].successResponse!.software.toLowerCase();

    this.loading = false;
  }

  public async cancelHesitation(instance: string): Promise<void> {
    this.loading = true;
    this.api.cancelHesitation(instance).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        this.loading = false;
        return;
      }

      this.instances = this.instances.filter(
        hesitatedInstance => hesitatedInstance.domain !== instance,
      );
      this.loading = false;
    });
  }
}
