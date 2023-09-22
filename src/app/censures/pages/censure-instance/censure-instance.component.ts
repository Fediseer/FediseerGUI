import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TitleService} from "../../../services/title.service";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {toPromise} from "../../../types/resolvable";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

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
    let availableReasons = await toPromise(this.api.getUsedReasons());
    if (availableReasons === null) {
      this.messageService.createWarning(`Couldn't get list of reasons you've used previously, autocompletion won't work.`);
      availableReasons = [];
    }
    this.availableReasons = availableReasons;
    this.loading = false;
  }

  public async doCensure(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.loading = true;
    this.api.censureInstance(
      this.form.controls.instance.value!,
      this.form.controls.reasons.value ? this.form.controls.reasons.value!.join(',') : null,
      this.form.controls.evidence.value,
    ).subscribe(response => {
      if (!response.success) {
        this.loading = false;
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        return;
      }

      this.cachedApi.getCensuresByInstances([this.authManager.currentInstanceSnapshot.name], {clear: true})
        .subscribe(() => {
          this.loading = false;
          this.router.navigateByUrl('/censures/my').then(() => {
            this.messageService.createSuccess(`${this.form.controls.instance.value} was successfully censured!`);
          });
        });
    });
  }
}
