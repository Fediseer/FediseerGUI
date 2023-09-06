import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {MessageService} from "../../../services/message.service";
import {Observable} from "rxjs";
import {Instance} from "../../../user/instance";
import {toObservable} from "../../../types/resolvable";

@Component({
  selector: 'app-my-endorsements',
  templateUrl: './my-endorsements.component.html',
  styleUrls: ['./my-endorsements.component.scss']
})
export class MyEndorsementsComponent implements OnInit {
  public endorsementsForMyInstance: InstanceDetailResponse[] = [];
  public endorsementsByMyInstance: InstanceDetailResponse[] = [];
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
    this.titleService.title = `My endorsements`;
    this.api.getEndorsementsForInstance(this.authManager.currentInstanceSnapshot.name).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.endorsementsForMyInstance = response.successResponse!.instances;
    });
    this.api.getEndorsementsByInstance([this.authManager.currentInstanceSnapshot.name]).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.endorsementsByMyInstance = response.successResponse!.instances;
    });
    this.api.getCurrentInstanceInfo().subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an error: ${response.errorResponse!.message}`);
        return;
      }

      this.guaranteed = response.successResponse!.guarantor !== undefined;
    });
  }

  public async cancelEndorsement(instance: string) {
    this.api.cancelEndorsement(instance).subscribe(response => {
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
