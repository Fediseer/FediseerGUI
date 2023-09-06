import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {Instance} from "../../../user/instance";

@Component({
  selector: 'app-glossary',
  templateUrl: './glossary.component.html',
  styleUrls: ['./glossary.component.scss']
})
export class GlossaryComponent implements OnInit {
  public currentInstance: Instance = this.authManager.currentInstanceSnapshot;

  constructor(
    private readonly titleService: TitleService,
    private readonly authManager: AuthenticationManagerService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Glossary';
  }
}
