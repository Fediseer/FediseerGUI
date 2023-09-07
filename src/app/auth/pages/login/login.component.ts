import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {MessageService} from "../../../services/message.service";
import {AuthenticatedInstance} from "../../../user/authenticated-instance";
import {Router} from "@angular/router";

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
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Log in';
  }

  public async doLogin(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.loading = true;
    const apiKey = this.form.controls.apiKey.value!;
    this.api.getCurrentInstanceInfo(apiKey).subscribe(response => {
        if (!response.success) {
          this.loading = false;
          this.messageService.createError('There was an error while logging in. Is the api key correct?');
          return;
        }

        this.authenticationManager.currentInstance = new AuthenticatedInstance(
          response.successResponse!.domain,
          apiKey,
        );

        this.router.navigateByUrl('/').then(() => {
          this.messageService.createSuccess('Successfully logged in.');
        });
      },
    );
  }
}
