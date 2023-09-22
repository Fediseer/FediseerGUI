import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {toPromise} from "../../../types/resolvable";
import {Router} from "@angular/router";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-reset-instance-token',
  templateUrl: './reset-instance-token.component.html',
  styleUrls: ['./reset-instance-token.component.scss']
})
export class ResetInstanceTokenComponent implements OnInit {
  public loading = true;
  public form = new FormGroup({
    currentApiKey: new FormControl<string>('', [Validators.required]),
    adminUsername: new FormControl<string>('', [Validators.required]),
  });
  public instance: string = this.authManager.currentInstanceSnapshot.name;
  public software: string | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly messageService: MessageService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = `Reset api key for ${this.authManager.currentInstanceSnapshot.name}`;
    const response = await toPromise(this.cachedApi.getCurrentInstanceInfo())
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }

    this.software = response.successResponse!.software.toLowerCase();
    this.loading = false;
  }

  public async validateAndReset(): Promise<void> {
    this.loading = true;
    if (this.form.controls.currentApiKey.value === null || this.form.controls.currentApiKey.value !== this.authManager.currentInstanceSnapshot.apiKey) {
      this.messageService.createError('The api key is not valid.');
      this.loading = false;
      return;
    }
    if (!this.form.valid) {
      this.messageService.createError('The form is not filled correctly.');
      this.loading = false;
      return;
    }

    const response = await toPromise(this.api.resetApiKey(
      this.authManager.currentInstanceSnapshot.name,
      this.form.controls.adminUsername.value!,
    ));
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }

    const newApiKey = response.successResponse!.new_key;

    this.cachedApi.clearCache();
    this.authManager.logout();
    this.router.navigateByUrl('/auth/login').then(() => {
      this.messageService.createSuccess(`${newApiKey} is your new api key. Please save it, it won't be shown again.`);
    });
  }
}
