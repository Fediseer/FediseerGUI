import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TitleService} from "../../../services/title.service";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {toPromise} from "../../../types/resolvable";
import {map} from "rxjs";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {TranslatorService} from "../../../services/translator.service";

@Component({
  selector: 'app-edit-endorsement-reasons',
  templateUrl: './edit-endorsement-reasons.component.html',
  styleUrls: ['./edit-endorsement-reasons.component.scss']
})
export class EditEndorsementReasonsComponent implements OnInit {
  public form = new FormGroup({
    instance: new FormControl<string>({value: '', disabled: true}, [Validators.required]),
    reasons: new FormControl<string[]>([]),
  });
  public loading: boolean = true;
  public availableReasons: string[] = [];

  constructor(
    private readonly titleService: TitleService,
    private readonly messageService: MessageService,
    private readonly api: FediseerApiService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authManager: AuthenticationManagerService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly translator: TranslatorService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = this.translator.get('app.endorsements.edit_reasons.title');

    this.activatedRoute.params.subscribe(async params => {
      const targetInstance = params['instance'] as string;
      let availableReasons = await toPromise(this.api.usedEndorsementReasons);
      if (availableReasons === null) {
        this.messageService.createWarning(this.translator.get('error.reasons.autocompletion.fetch'));
        availableReasons = [];
      }
      this.availableReasons = availableReasons;

      const existing = await toPromise(
        this.api.getEndorsementsByInstance([this.authManager.currentInstanceSnapshot.name]).pipe(
          map(response => {
            if (this.apiResponseHelper.handleErrors([response])) {
              return null;
            }

            const instance = response.successResponse!.instances.filter(
              instance => instance.domain === targetInstance,
            );
            if (!instance.length) {
              this.messageService.createError(this.translator.get('error.endorsements.instance_not_endorsed'));
              return null;
            }

            return instance[0];
          }),
        ),
      );

      if (existing === null) {
        this.loading = false;
        return;
      }

      this.form.patchValue({
        instance: existing.domain,
        reasons: NormalizedInstanceDetailResponse.fromInstanceDetail(existing).unmergedEndorsementReasons,
      });
      this.loading = false;
    });
  }

  public async updateReasons(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError(this.translator.get('error.form_invalid.generic'));
      return;
    }

    this.loading = true;
    this.api.updateEndorsement(
      this.form.controls.instance.value!,
      this.form.controls.reasons.value ? this.form.controls.reasons.value!.join(',') : null,
    ).subscribe(response => {
      if (this.apiResponseHelper.handleErrors([response])) {
        this.loading = false;
        return;
      }

      this.loading = false;
      this.router.navigateByUrl('/endorsements/my').then(() => {
        this.messageService.createSuccess(this.translator.get('app.endorsements.success.update'));
      });
    });
  }
}
