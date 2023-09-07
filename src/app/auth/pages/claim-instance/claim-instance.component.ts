import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "../../../services/message.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-claim-instance',
  templateUrl: './claim-instance.component.html',
  styleUrls: ['./claim-instance.component.scss']
})
export class ClaimInstanceComponent implements OnInit {
  public form = new FormGroup({
    admin: new FormControl<string>('', [Validators.required]),
    instance: new FormControl<string>('', [Validators.required]),
  })
  public loading = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly messageService: MessageService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Claim an instance';
  }

  public async doClaimInstance(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.loading = true;
    this.api.claimInstance(
      this.form.controls.instance.value!,
      this.form.controls.admin.value!,
    ).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`The api returned this error: ${response.errorResponse!.message}`);
        this.loading = false;
        return;
      }

      this.router.navigateByUrl('/auth/login').then(() => {
        this.messageService.createSuccess('Done! You should soon receive a private message with the api key.');
      });
    });
  }
}
