import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActionLogReportActivity, ActionLogReportType, ActionLogResponse} from "../../../response/action-log.response";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {MessageService} from "../../../services/message.service";
import {ActivatedRoute, Router} from "@angular/router";
import {int} from "../../../types/number";
import {range} from "../../../shared/helper/range";

@Component({
  selector: 'app-action-log',
  templateUrl: './action-log.component.html',
  styleUrls: ['./action-log.component.scss']
})
export class ActionLogComponent implements OnInit {
  private readonly apiPagesPerPage = 2;

  protected readonly ActionLogReportType = ActionLogReportType;
  protected readonly ActionLogReportActivity = ActionLogReportActivity;

  public loading: boolean = true;
  public actionLog: ActionLogResponse | null = null;

  public pages: int[] = range(15);
  public currentPage: int = 1;
  public lastPageReached: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Action log';

    this.activatedRoute.queryParams.subscribe(async params => {
      this.loading = true;

      this.currentPage = Number(params['page'] ?? 1);
      const pageStart = ((this.currentPage - 1) * this.apiPagesPerPage) + 1;
      const pageEnd = this.currentPage * this.apiPagesPerPage;

      const response = await toPromise(this.api.getActionLog(pageStart, pageEnd));
      if (response === null) {
        this.messageService.createError('Failed getting list of actions');
        this.loading = false;
        return;
      }
      this.actionLog = response;
      if (!this.actionLog.length) {
        this.messageService.createWarning('No more pages available');
        this.lastPageReached = true;
        this.goToPage(this.currentPage - 1);
        this.pages.pop();
        return;
      }

      if (!this.lastPageReached && !this.pages.includes(this.currentPage + 1)) {
        this.pages.push(this.currentPage + 1);
      }

      this.loading = false;
    });
  }

  public goToPage(page: int): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
  }
}
