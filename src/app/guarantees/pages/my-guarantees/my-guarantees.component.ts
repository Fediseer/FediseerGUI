import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {MessageService} from "../../../services/message.service";
import {map, Observable} from "rxjs";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {Instance} from "../../../user/instance";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {toPromise} from "../../../types/resolvable";

@Component({
  selector: 'app-my-guarantees',
  templateUrl: './my-guarantees.component.html',
  styleUrls: ['./my-guarantees.component.scss']
})
export class MyGuaranteesComponent implements OnInit {
  public guarantor: string = '';
  public instancesGuaranteedByMe: InstanceDetailResponse[] = [];
  public instance: Observable<Instance> = this.authManager.currentInstance;
  public loading: boolean = true;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly messageService: MessageService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'My guarantees';

    const responses = await Promise.all([
      toPromise(this.api.getCurrentInstanceInfo()),
      toPromise(this.api.getGuaranteesByInstance(this.authManager.currentInstanceSnapshot.name!)),
    ]);

    if (this.apiResponseHelper.handleErrors(responses)) {
      this.loading = false;
      return;
    }

    this.guarantor = responses[0].successResponse!.guarantor ?? '';
    this.instancesGuaranteedByMe = responses[1].successResponse!.instances;

    this.loading = false;
  }

  public async cancelGuarantee(instance: string): Promise<void> {
    this.loading = true;
    this.api.cancelGuarantee(instance).subscribe(response => {
      this.loading = false;
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }

      this.instancesGuaranteedByMe = this.instancesGuaranteedByMe.filter(
        guaranteedInstance => guaranteedInstance.domain !== instance,
      );
    });
  }
}