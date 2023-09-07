import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";

@Component({
  selector: 'app-my-censures',
  templateUrl: './my-censures.component.html',
  styleUrls: ['./my-censures.component.scss']
})
export class MyCensuresComponent implements OnInit {
  public instances: InstanceDetailResponse[] = [];
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
    this.titleService.title = `My censures`;

    const responses = await Promise.all([
      toPromise(this.api.getCensuresByInstances([this.authManager.currentInstanceSnapshot.name])),
      toPromise(this.api.getCurrentInstanceInfo()),
    ])

    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.instances = responses[0].successResponse!.instances;
    this.guaranteed = responses[1].successResponse!.guarantor !== undefined;

    this.loading = false;
  }

  public async cancelCensure(instance: string): Promise<void> {
    this.loading = true;
    this.api.cancelCensure(instance).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        this.loading = false;
        return;
      }

      this.instances = this.instances.filter(
        censuredInstance => censuredInstance.domain !== instance,
      );
      this.loading = false;
    });
  }
}
