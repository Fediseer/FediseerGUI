import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {AuthenticatedInstance} from "../../../user/authenticated-instance";
import {Router} from "@angular/router";
import {DatabaseService} from "../../../services/database.service";
import {TranslatorService} from "../../../services/translator.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public form = new FormGroup({
    apiKey: new FormControl<string>('', [Validators.required]),
  })
  public loading: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly authenticationManager: AuthenticationManagerService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly database: DatabaseService,
    private readonly translator: TranslatorService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Log in';
  }

  public async doLogin(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError(this.translator.get('error.form_invalid.generic'));
      return;
    }

    this.loading = true;
    const apiKey = this.form.controls.apiKey.value!;
    this.api.getCurrentInstanceInfo(apiKey).subscribe(response => {
      if (this.apiResponseHelper.handleErrors([response])) {
        this.loading = false;
        return;
      }

      this.authenticationManager.currentInstance = new AuthenticatedInstance(
        response.successResponse!.domain,
        apiKey,
      );
      this.database.addAvailableAccount(this.authenticationManager.currentInstanceSnapshot);

      this.router.navigateByUrl('/').then(() => {
        this.messageService.createSuccess(this.translator.get('app.auth.login.success_message'));
      });
    },
    );
  }
}
