import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {TranslatorService} from "../../../services/translator.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Resolvable, toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {MessageService} from "../../../services/message.service";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {SuccessResponse} from "../../../response/success.response";

interface Reason {
  reasons: string[];
  evidence: string;
}

@Component({
  selector: 'app-create-rebuttal',
  templateUrl: './create-edit-rebuttal.component.html',
  styleUrls: ['./create-edit-rebuttal.component.scss']
})
export class CreateEditRebuttalComponent implements OnInit {
  public hesitation: Reason | null = null;
  public censure: Reason | null = null;
  public sourceInstance: string | null = null;

  public form = new FormGroup({
    rebuttal: new FormControl<string>(''),
  });

  public loading: boolean = true;
  public isNew: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly translator: TranslatorService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly api: FediseerApiService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly authManager: AuthenticationManagerService,
    private readonly messageService: MessageService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      this.loading = true;
      this.sourceInstance = params['sourceInstance'];

      this.titleService.title = this.translator.get('app.rebuttal.title', {
        instanceName: this.sourceInstance,
      });

      const responses = await Promise.all([
        toPromise(this.cachedApi.getHesitationsForInstance(this.authManager.currentInstanceSnapshot.name)),
        toPromise(this.cachedApi.getCensuresForInstance(this.authManager.currentInstanceSnapshot.name)),
      ]);
      if (this.apiResponseHelper.handleErrors(responses)) {
        this.loading = false;
        return;
      }

      const hesitations = responses[0].successResponse!.instances.filter(
        instance => instance.domain === this.sourceInstance!,
      ).map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));
      const censures = responses[1].successResponse!.instances.filter(
        instance => instance.domain === this.sourceInstance!,
      ).map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance));

      let rebuttal: string | null = null;
      if (hesitations.length && (hesitations[0].hesitationsEvidence || hesitations[0].hesitationReasons.length)) {
        this.hesitation = {
          evidence: hesitations[0].hesitationsEvidence,
          reasons: hesitations[0].hesitationReasons,
        };
        if (hesitations[0].rebuttal !== null) {
          rebuttal = hesitations[0].rebuttal;
        }
      }
      if (censures.length && (censures[0].censuresEvidence || censures[0].censureReasons.length)) {
        this.censure = {
          evidence: censures[0].censuresEvidence,
          reasons: censures[0].censureReasons,
        };
        if (censures[0].rebuttal !== null) {
          rebuttal = censures[0].rebuttal;
        }
      }

      this.isNew = rebuttal === null;

      if (this.hesitation === null && this.censure === null) {
        this.loading = false;
        this.messageService.createError(this.translator.get('app.error.rebuttal.no_censure_hesitation'));
        return;
      }

      this.form.patchValue({rebuttal: rebuttal ?? ''});

      this.loading = false;
    });
  }

  public async onSubmit() {
    this.loading = true;
    const rebuttal = this.form.controls.rebuttal.value ?? '';
    if (this.isNew && !rebuttal) {
      this.messageService.createWarning(this.translator.get('app.warning.empty_rebuttal'));
      this.loading = false;
      return;
    }

    let message: Resolvable<string>;
    let response: ApiResponse<SuccessResponse>;
    if (!rebuttal) {
      response = await toPromise(this.api.removeRebuttal(this.sourceInstance!));
      message = this.translator.get('app.rebuttal.deleted');
    } else if (this.isNew) {
      response = await toPromise(this.api.createRebuttal(this.sourceInstance!, rebuttal));
      message = this.translator.get('app.rebuttal.created');
    } else {
      response = await toPromise(this.api.updateRebuttal(this.sourceInstance!, rebuttal));
      message = this.translator.get('app.rebuttal.updated');
    }
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }

    await Promise.all([
      toPromise(this.cachedApi.getHesitationsForInstance(this.authManager.currentInstanceSnapshot.name, {clear: true})),
      toPromise(this.cachedApi.getCensuresForInstance(this.authManager.currentInstanceSnapshot.name, {clear: true})),
    ]);
    this.cachedApi.clearCensuresByInstanceCache(this.sourceInstance!);
    this.cachedApi.clearHesitationsByInstanceCache(this.sourceInstance!);

    this.router.navigateByUrl(`/instances/detail/${this.authManager.currentInstanceSnapshot.name}`).then(() => {
      this.messageService.createSuccess(message);
    });
  }
}
