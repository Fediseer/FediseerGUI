import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {Instance} from "../../../user/instance";
import {MessageService, MessageType} from "../../../services/message.service";

@Component({
  selector: 'app-list-solicitations',
  templateUrl: './list-solicitations.component.html',
  styleUrls: ['./list-solicitations.component.scss']
})
export class ListSolicitationsComponent implements OnInit {
  public loading: boolean = true;
  public instances: InstanceDetailResponse[] = [];
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;
  public currentInstanceDetail: InstanceDetailResponse | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly authManager: AuthenticationManagerService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Instance claim solicitations';

    const response = await toPromise(this.api.getSolicitations());
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }

    if (!this.authManager.currentInstanceSnapshot.anonymous) {
      const response = await toPromise(this.api.getCurrentInstanceInfo());
      if (!this.apiResponseHelper.handleErrors([response], MessageType.Warning)) {
        this.currentInstanceDetail = response.successResponse!;
      }
    }

    this.instances = response.successResponse!.instances;
    this.loading = false;
  }

  public async guaranteeFor(instance: string): Promise<void> {
    this.loading = true;

    const response = await toPromise(this.api.guaranteeInstance(instance));
    if (!this.apiResponseHelper.handleErrors([response])) {
      this.messageService.createSuccess(`Successfully guaranteed for ${instance}!`);
      this.instances = this.instances.filter(item => item.domain !== instance);
    }
    this.loading = false;
  }
}