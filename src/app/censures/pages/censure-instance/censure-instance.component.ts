import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TitleService} from "../../../services/title.service";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-censure-instance',
  templateUrl: './censure-instance.component.html',
  styleUrls: ['./censure-instance.component.scss']
})
export class CensureInstanceComponent implements OnInit {
  public form = new FormGroup({
    instance: new FormControl<string>('', [Validators.required]),
    reason: new FormControl<string>(''),
  });
  public loading: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly messageService: MessageService,
    private readonly api: FediseerApiService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {
  }
  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Censure an instance';

    this.activatedRoute.queryParams.subscribe(query => {
      if (!query['instance']) {
        return;
      }

      this.form.patchValue({instance: query['instance']});
    });
  }

  public async doCensure(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.loading = true;
    this.api.censureInstance(
      this.form.controls.instance.value!,
      this.form.controls.reason.value ?? null,
    ).subscribe(response => {
      if (!response.success) {
        this.loading = false;
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }

      this.loading = false;
      this.router.navigateByUrl('/censures/my').then(() => {
        this.messageService.createSuccess(`${this.form.controls.instance.value} was successfully censured!`);
      });
    });
  }
}
