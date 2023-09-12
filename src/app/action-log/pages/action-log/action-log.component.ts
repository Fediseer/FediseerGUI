import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActionLogReportActivity, ActionLogReportType, ActionLogResponse} from "../../../response/action-log.response";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";

@Component({
  selector: 'app-action-log',
  templateUrl: './action-log.component.html',
  styleUrls: ['./action-log.component.scss']
})
export class ActionLogComponent implements OnInit {
  protected readonly ActionLogReportType = ActionLogReportType;

  public loading: boolean = true;
  public actionLog: ActionLogResponse | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Action log';

    const response = await toPromise(this.api.getActionLog());
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }

    this.actionLog = response.successResponse!;
    this.loading = false;
  }

  protected readonly ActionLogReportActivity = ActionLogReportActivity;
}
