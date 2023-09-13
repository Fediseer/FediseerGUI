import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {toPromise} from "../../../types/resolvable";
import {MessageService} from "../../../services/message.service";
import {SuspiciousInstanceDetailResponse} from "../../../response/suspicious-instance-detail.response";

@Component({
  selector: 'app-suspicious-instance-detail',
  templateUrl: './suspicious-instance-detail.component.html',
  styleUrls: ['./suspicious-instance-detail.component.scss']
})
export class SuspiciousInstanceDetailComponent implements OnInit {
  public loading: boolean = true;
  public detail: SuspiciousInstanceDetailResponse | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      this.loading = true;

      const instanceDomain = <string>params['instance'];
      this.titleService.title = `${instanceDomain} | Instance detail`;

      const instanceList = await toPromise(this.api.getSuspiciousInstances());
      if (this.apiResponseHelper.handleErrors([instanceList])) {
        this.loading = false;
        return;
      }

      const instance = instanceList.successResponse!.instances.filter(
        instance => instance.domain === instanceDomain,
      )[0] ?? null;

      if (instance === null) {
        this.messageService.createError('This instance is not on the list of suspicious instances.');
        this.loading = false;
        return;
      }
      this.detail = instance;
      this.loading = false;
    });
  }
}
