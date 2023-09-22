import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../services/title.service";
import {AuthenticationManagerService} from "../../services/authentication-manager.service";
import {Instance} from "../../user/instance";
import {InstanceDetailResponse} from "../../response/instance-detail.response";
import {CachedFediseerApiService} from "../../services/cached-fediseer-api.service";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;
  public currentInstanceDetail: InstanceDetailResponse | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
    private readonly cachedApi: CachedFediseerApiService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Fediseer';

    this.cachedApi.getCurrentInstanceInfo().subscribe(response => {
      if (!response.success) {
        return;
      }

      this.currentInstanceDetail = response.successResponse!;
    });
  }
}
