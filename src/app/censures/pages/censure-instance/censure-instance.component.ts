import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TitleService} from "../../../services/title.service";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {toPromise} from "../../../types/resolvable";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {forkJoin} from "rxjs";
import {TranslatorService} from "../../../services/translator.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";

@Component({
  selector: 'app-censure-instance',
  templateUrl: './censure-instance.component.html',
  styleUrls: ['./censure-instance.component.scss']
})
export class CensureInstanceComponent implements OnInit {
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
    private readonly translator: TranslatorService,
    private readonly apiResponseHelper: ApiResponseHelperService,
  ) {
  }
  public async ngOnInit(): Promise<void> {
    this.titleService.title = this.translator.get('app.censures.title');

    this.activatedRoute.queryParams.subscribe(query => {
      if (!query['instance']) {
        return;
      }

      this.form.patchValue({instance: query['instance']});
    });
    let availableReasons = await toPromise(this.cachedApi.getUsedReasons());
    if (availableReasons === null) {
      this.messageService.createWarning(this.translator.get('error.reasons.autocompletion.fetch'));
      availableReasons = [];
    }
    this.availableReasons = availableReasons;
    this.loading = false;
  }

  public async doCensure(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError(this.translator.get('error.form_invalid.generic'));
      return;
    }

    this.loading = true;
    this.api.censureInstance(
      this.form.controls.instance.value!,
      this.form.controls.reasons.value ? this.form.controls.reasons.value!.join(',') : null,
      this.form.controls.evidence.value,
    ).subscribe(response => {
      if (this.apiResponseHelper.handleErrors([response])) {
        this.loading = false;
        return;
      }

      const currentInstance = this.authManager.currentInstanceSnapshot.name;
      forkJoin([
        this.cachedApi.getGuaranteesByInstance(currentInstance, {clear: true}),
        this.cachedApi.getCensuresByInstances([currentInstance], {clear: true}),
        this.cachedApi.getHesitationsByInstances([currentInstance], {clear: true}),
      ]).subscribe(() => {
        this.loading = false;
        this.router.navigateByUrl('/censures/my').then(() => {
          this.messageService.createSuccess(this.translator.get('app.censures.instance_censured', {
            instance: this.form.controls.instance.value!,
          }));
        });
      });
    });
  }
}
