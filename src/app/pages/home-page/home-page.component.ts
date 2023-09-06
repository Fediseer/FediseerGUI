import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../services/title.service";
import {AuthenticationManagerService} from "../../services/authentication-manager.service";
import {Instance} from "../../user/instance";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Fediseer';
  }
}
