import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FormControl, FormGroup} from "@angular/forms";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {toPromise} from "../../../types/resolvable";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {MessageService} from "../../../services/message.service";
import {Router} from "@angular/router";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-create-solicitation',
  templateUrl: './create-solicitation.component.html',
  styleUrls: ['./create-solicitation.component.scss']
})
export class CreateSolicitationComponent implements OnInit {
  public loading: boolean = true;
  public currentInstance: InstanceDetailResponse | null = null;

  public form = new FormGroup({
    guarantor: new FormControl<string | null>(null),
    comment: new FormControl<string | null>(null),
  });

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Ask for a guarantee';

    const response = await toPromise(this.cachedApi.getCurrentInstanceInfo());
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }

    this.currentInstance = response.successResponse!;
    if (this.currentInstance.guarantor) {
      this.messageService.createError('Your instance is already guaranteed');
      this.form.controls.comment.disable();
      this.form.controls.guarantor.disable();
    }
    this.loading = false;
  }

  public async askForAGuarantee(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError('The form is not valid, please fill all fields correctly.');
      return;
    }

    this.loading = true;
    const result = await toPromise(this.api.solicitGuarantee(
      this.form.controls.guarantor.value,
      this.form.controls.comment.value,
    ));
    if (this.apiResponseHelper.handleErrors([result])) {
      this.loading = false;
      return;
    }
    this.router.navigateByUrl('/solicitations').then(() => {
      this.messageService.createSuccess('Your request has been successfully submitted.');
    });
  }
}
