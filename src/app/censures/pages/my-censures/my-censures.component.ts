import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";

@Component({
  selector: 'app-my-censures',
  templateUrl: './my-censures.component.html',
  styleUrls: ['./my-censures.component.scss']
})
export class MyCensuresComponent implements OnInit {
  public instances: InstanceDetailResponse[] = [];
  public instance: Observable<Instance> = this.authManager.currentInstance;
  public guaranteed: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = `My censures`;

    this.api.getCensuresByInstances([this.authManager.currentInstanceSnapshot.name]).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.instances = response.successResponse!.instances;
    });

    this.api.getCurrentInstanceInfo().subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.guaranteed = response.successResponse!.guarantor !== undefined;
    });
  }

  public async cancelCensure(instance: string): Promise<void> {
    this.api.cancelCensure(instance).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.instances = this.instances.filter(
        censoredInstance => censoredInstance.domain !== instance,
      );
    });
  }
}
