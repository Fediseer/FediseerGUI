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
import {FormControl, FormGroup} from "@angular/forms";
import {map} from "rxjs";
import {TranslatorService} from "../../../services/translator.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

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

  public pages: int[] = range(5);
  public currentPage: int = 1;
  public lastPageReached: boolean = false;

  public whitelistedDomains: string[] | null = null;
  public blacklistedDomains: string[] | null = null;

  public form = new FormGroup({
    type: new FormControl<ActionLogReportType | null>(null),
    activity: new FormControl<ActionLogReportActivity | null>(null),
    sourceDomains: new FormControl<string[]>([]),
    targetDomains: new FormControl<string[]>([]),
  });

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly messageService: MessageService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly translator: TranslatorService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = this.translator.get('app.action_log');

    const responses = await Promise.all([
      toPromise(this.cachedApi.getWhitelistedInstances().pipe(
        map (response => {
          if (this.apiResponseHelper.handleErrors([response])) {
            return [];
          }

          return response.successResponse!.instances.map(instance => instance.domain);
        }),
      )),
      toPromise(this.api.getCensuredInstances().pipe(
        map (response => {
          if (this.apiResponseHelper.handleErrors([response])) {
            return [];
          }

          return response.successResponse!.instances.map(instance => instance.domain);
        }),
      )),
    ]);

    this.whitelistedDomains = responses[0];
    this.blacklistedDomains = responses[1];

    this.activatedRoute.queryParams.subscribe(async params => {
      this.loading = true;
      this.currentPage = Number(params['page'] ?? 1);

      this.form.patchValue({
        sourceDomains: params['sourceDomains'] ? params['sourceDomains'].split(',') : [],
        targetDomains: params['targetDomains'] ? params['targetDomains'].split(',') : [],
        activity: (params['activity'] === 'null' ? null : params['activity']) ?? null,
        type: (params['type'] === 'null' ? null : params['type']) ?? null,
      });

      const pageStart = ((this.currentPage - 1) * this.apiPagesPerPage) + 1;
      const pageEnd = this.currentPage * this.apiPagesPerPage;

      const response = await toPromise(this.api.getActionLog(pageStart, pageEnd, {
        targetDomains: this.form.controls.targetDomains.value ?? undefined,
        sourceDomains: this.form.controls.sourceDomains.value ?? undefined,
        activity: this.form.controls.activity.value ?? undefined,
        type: this.form.controls.type.value ?? undefined,
      }));
      if (response === null) {
        this.messageService.createError(this.translator.get('error.action_log.failed_getting'));
        this.loading = false;
        return;
      }
      this.actionLog = response;
      if (!this.actionLog.length) {
        this.messageService.createWarning(this.translator.get('error.pagination.no_more_pages'));
        this.lastPageReached = true;
        if (this.currentPage !== 1) {
          this.goToPage(this.currentPage - 1);
          this.pages.pop();
        }
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

  public async filterLog(): Promise<void> {
    let sourceDomains: string[] | undefined = this.form.controls.sourceDomains.value ?? [];
    if (!sourceDomains.length) {
      sourceDomains = undefined;
    }
    let targetDomains: string[] | undefined = this.form.controls.targetDomains.value ?? [];
    if (!targetDomains.length) {
      targetDomains = undefined;
    }

    const query = {
      page: this.currentPage,
      type: this.form.controls.type.value ?? undefined,
      activity: this.form.controls.activity.value ?? undefined,
      sourceDomains: sourceDomains?.join(','),
      targetDomains: targetDomains?.join(','),
    }

    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: query,
    });
    this.lastPageReached = false;
  }
}
