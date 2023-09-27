import {Component, OnInit} from '@angular/core';
import {LemmyApiService} from "../../../services/lemmy-api.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {PermanentCacheService} from "../../../services/cache/permanent-cache.service";
import {toPromise} from "../../../types/resolvable";

@Component({
  selector: 'app-instance-logo',
  templateUrl: './instance-logo.component.html',
  styleUrls: ['./instance-logo.component.scss']
})
export class InstanceLogoComponent implements OnInit {
  private readonly cacheFor: number = 3600;
  private readonly defaultSource = '/assets/logo.png';

  public source: string = this.defaultSource;

  constructor(
    private readonly authManager: AuthenticationManagerService,
    private readonly fediseerApi: CachedFediseerApiService,
    private readonly cache: PermanentCacheService,
    private readonly lemmyApi: LemmyApiService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.authManager.currentInstance.subscribe(async instance => {
      const cacheItem = this.cache.getItem<string>(`instance.${instance.name}.logo`);
      if (cacheItem.isHit) {
        this.source = cacheItem.value!;
        return;
      }
      const detail = await toPromise(this.fediseerApi.getCurrentInstanceInfo());
      if (!detail.success) {
        this.source = this.defaultSource;
        return;
      }

      let source: string | null = null;
      const software = detail.successResponse!.software.toLowerCase();
      switch (software) {
        case 'lemmy':
          source = await this.getIconForLemmy(detail.successResponse!.domain);
          break;
      }

      if (source === null) {
        this.source = this.defaultSource;
        return;
      }

      cacheItem.value = source;
      cacheItem.expiresAt = new Date(new Date().getTime() + (this.cacheFor * 1_000));
      this.cache.save(cacheItem);

      this.source = source;
    });
  }

  private async getIconForLemmy(instance: string): Promise<string | null> {
    return (await toPromise(this.lemmyApi.getSiteInfo(instance))).site_view.site.icon ?? null;
  }
}
