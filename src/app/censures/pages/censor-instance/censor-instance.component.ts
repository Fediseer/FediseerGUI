import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TitleService} from "../../../services/title.service";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-censor-instance',
  templateUrl: './censor-instance.component.html',
  styleUrls: ['./censor-instance.component.scss']
})
export class CensorInstanceComponent implements OnInit {
  public form = new FormGroup({
    instance: new FormControl<string>('', [Validators.required]),
    reason: new FormControl<string>('', [Validators.required]),
  });

  constructor(
    private readonly titleService: TitleService,
    private readonly messageService: MessageService,
    private readonly api: FediseerApiService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {
  }
  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Censor an instance';

    this.activatedRoute.queryParams.subscribe(query => {
      if (!query['instance']) {
        return;
      }

      this.form.patchValue({instance: query['instance']});
    });
  }

  public async doCensor(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.api.censorInstance(
      this.form.controls.instance.value!,
      this.form.controls.reason.value!,
    ).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }

      this.router.navigateByUrl('/censures/my').then(() => {
        this.messageService.createSuccess(`${this.form.controls.instance.value} was successfully censored!`);
      });
    });
  }
}
