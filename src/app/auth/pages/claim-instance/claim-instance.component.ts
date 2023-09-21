import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "../../../services/message.service";
import {Router} from "@angular/router";
import {PrivateMessageProxy} from "../../../types/private-message-proxy";
import {TranslatorService} from "../../../services/translator.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";

@Component({
  selector: 'app-claim-instance',
  templateUrl: './claim-instance.component.html',
  styleUrls: ['./claim-instance.component.scss']
})
export class ClaimInstanceComponent implements OnInit {
  protected readonly PrivateMessageProxy = PrivateMessageProxy;

  public form = new FormGroup({
    admin: new FormControl<string>('', [Validators.required]),
    instance: new FormControl<string>('', [Validators.required]),
    pmProxy: new FormControl<PrivateMessageProxy>(PrivateMessageProxy.None, [Validators.required]),
  })
  public loading = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly translator: TranslatorService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = this.translator.get('app.auth.claim_instance.title');
  }

  public async doClaimInstance(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError(this.translator.get('error.form_invalid.generic'));
      return;
    }

    this.loading = true;
    this.api.claimInstance(
      this.form.controls.instance.value!,
      this.form.controls.admin.value!,
      this.form.controls.pmProxy.value!,
    ).subscribe(response => {
      if (this.apiResponseHelper.handleErrors([response])) {
        this.loading = false;
        return;
      }

      this.router.navigateByUrl('/auth/login').then(() => {
        this.messageService.createSuccess(this.translator.get('app.auth.claim_instance.success_message'));
      });
    });
  }
}
