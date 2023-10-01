import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {toPromise} from "../../../types/resolvable";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {MessageService} from "../../../services/message.service";
import {ListVisibility} from "../../../types/list-visibility";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-edit-own-instance',
  templateUrl: './edit-own-instance.component.html',
  styleUrls: ['./edit-own-instance.component.scss']
})
export class EditOwnInstanceComponent implements OnInit {
  protected readonly ListVisibility = ListVisibility;

  private originalTags: string[] = [];

  public loading: boolean = true;
  public detail: InstanceDetailResponse | null = null;
  public form = new FormGroup({
    sysadmins: new FormControl<number | null>(null),
    moderators: new FormControl<number | null>(null),
    censuresVisibility: new FormControl<ListVisibility>(ListVisibility.Open, [Validators.required]),
    hesitationsVisibility: new FormControl<ListVisibility>(ListVisibility.Open, [Validators.required]),
    endorsementsVisibility: new FormControl<ListVisibility>(ListVisibility.Open, [Validators.required]),
    tags: new FormControl<string[]>([]),
  });
  public availableTags: string[] = [];

  constructor(
    private readonly titleService: TitleService,
    private readonly api: FediseerApiService,
    private readonly cachedApi: CachedFediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly messageService: MessageService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Edit instance';

    const response = await toPromise(this.api.getCurrentInstanceInfo());
    if (this.apiResponseHelper.handleErrors([response])) {
      this.loading = false;
      return;
    }
    this.detail = response.successResponse!;
    this.form.patchValue({
      sysadmins: this.detail.sysadmins,
      moderators: this.detail.moderators,
      censuresVisibility: this.detail.visibility_censures!,
      endorsementsVisibility: this.detail.visibility_endorsements!,
      hesitationsVisibility: this.detail.visibility_hesitations!,
      tags: this.detail.tags,
    });
    this.titleService.title = `Editing ${this.detail.domain}`;
    this.originalTags = this.detail.tags;
    // this.availableTags = this.detail.tags;
    this.availableTags = await toPromise(this.cachedApi.getAvailableTags());
    this.loading = false;
  }

  public async updateInstance(): Promise<void> {
    const addedTags = this.form.controls.tags.value!.filter(tag => !this.originalTags.includes(tag));
    const removedTags = this.originalTags.filter(tag => !this.form.controls.tags.value!.includes(tag));

    const requests: Promise<ApiResponse<any>>[] = [
      toPromise(this.api.updateInstanceData(this.detail!.domain, {
        moderators: this.form.controls.moderators.value,
        sysadmins: this.form.controls.sysadmins.value,
        visibility_endorsements: this.form.controls.endorsementsVisibility.value!,
        visibility_censures: this.form.controls.censuresVisibility.value!,
        visibility_hesitations: this.form.controls.hesitationsVisibility.value!,
      })),
    ];
    if (addedTags.length) {
      requests.push(toPromise(this.api.tagInstance(addedTags)));
    }
    if (removedTags.length) {
      requests.push(toPromise(this.api.removeInstanceTags(removedTags)));
    }

    const responses = await Promise.all(requests);

    if (this.apiResponseHelper.handleErrors(responses)) {
      return;
    }

    this.cachedApi.clearWhitelistCache();
    this.cachedApi.getAvailableTags({clear: true}).subscribe();
    this.cachedApi.getCurrentInstanceInfo(null, {clear: true}).subscribe();

    this.messageService.createSuccess('The data were successfully updated!')
  }
}
