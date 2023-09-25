import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {toPromise} from "../../../types/resolvable";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";

@Component({
  selector: 'app-hesitate-on-instance',
  templateUrl: './hesitate-on-instance.component.html',
  styleUrls: ['./hesitate-on-instance.component.scss']
})
export class HesitateOnInstanceComponent implements OnInit {
  public form = new FormGroup({
    instance: new FormControl<string>('', [Validators.required]),
    reasons: new FormControl<string[]>([]),
    evidence: new FormControl<string | null>(null),
  });
  public loading: boolean = true;
  public availableReasons: string[] = [];

  constructor(
    private readonly titleService: TitleService,
    private readonly messageService: MessageService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authManager: AuthenticationManagerService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Hesitate on an instance';

    this.activatedRoute.queryParams.subscribe(query => {
      if (!query['instance']) {
        return;
      }

      this.form.patchValue({instance: query['instance']});
    });
    let availableReasons = await toPromise(this.cachedApi.getUsedReasons());
    if (availableReasons === null) {
      this.messageService.createWarning(`Couldn't get list of reasons you've used previously, autocompletion won't work.`);
      availableReasons = [];
    }
    this.availableReasons = availableReasons;
    this.loading = false;
  }

  public async doHesitate(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.loading = true;
    this.api.hesitateOnAnInstance(
      this.form.controls.instance.value!,
      this.form.controls.reasons.value ? this.form.controls.reasons.value!.join(',') : null,
      this.form.controls.evidence.value,
    ).subscribe(response => {
      if (!response.success) {
        this.loading = false;
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }

      this.cachedApi.getHesitationsByInstances([this.authManager.currentInstanceSnapshot.name], {clear: true})
        .subscribe(() => {
          this.loading = false;
          this.router.navigateByUrl('/hesitations/my').then(() => {
            this.messageService.createSuccess(`${this.form.controls.instance.value} was successfully hesitated on!`);
          });
        });
    });
  }
}
