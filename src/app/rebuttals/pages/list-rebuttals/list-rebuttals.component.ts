import {Component, computed, input, OnInit, signal} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {TranslatorService} from "../../../services/translator.service";
import {SharedModule} from "../../../shared/shared.module";
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {toPromise} from "../../../types/resolvable";
import {filter, map, zip} from "rxjs";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {NormalizedInstanceDetailResponse} from "../../../response/normalized-instance-detail.response";
import {RouterLink} from "@angular/router";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-list-rebuttals',
  standalone: true,
  imports: [
    SharedModule,
    RouterLink
  ],
  templateUrl: './list-rebuttals.component.html',
  styleUrl: './list-rebuttals.component.scss'
})
export class ListRebuttalsComponent implements OnInit {
  private rawInstances = signal<InstanceDetailResponse[]>([]);

  public loading = signal(true);
  public instances = computed(() => this.rawInstances().map(instance => NormalizedInstanceDetailResponse.fromInstanceDetail(instance)));
  public currentInstance = signal(this.authManager.currentInstanceSnapshot.name);

  constructor(
    private readonly titleService: TitleService,
    private readonly translator: TranslatorService,
    private readonly api: FediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly cachedApi: CachedFediseerApiService,
  ) {
  }
  public async ngOnInit(): Promise<void> {
    this.titleService.title = this.translator.get('app.my_rebuttals.title');
    this.rawInstances.set(await toPromise(zip([
      this.api.getHesitationsForInstance(this.currentInstance()),
      this.api.getCensuresForInstance(this.currentInstance()),
    ]).pipe(
      map(responses => {
        if (this.apiResponseHelper.handleErrors(responses)) {
          return [];
        }

        return responses[0].successResponse!.instances.concat(responses[1].successResponse!.instances)
          .filter(instance => instance.rebuttal?.length)
      }),
    )));
    this.loading.set(false);
  }

  public async removeRebuttal(instance: NormalizedInstanceDetailResponse): Promise<void> {
    this.loading.set(true);
    const response = await toPromise(this.api.removeRebuttal(instance.domain));
    this.apiResponseHelper.handleErrors(response);

    await Promise.all([
      toPromise(this.cachedApi.getHesitationsForInstance(this.currentInstance(), {clear: true})),
      toPromise(this.cachedApi.getCensuresForInstance(this.currentInstance(), {clear: true})),
    ]);
    this.cachedApi.clearCensuresByInstanceCache(instance.domain);
    this.cachedApi.clearHesitationsByInstanceCache(instance.domain);
    this.rawInstances.update(value => [...value.filter(rawInstance => rawInstance.domain !== instance.domain)]);

    this.loading.set(false);
  }
}
