import {Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import {TitleService} from "./services/title.service";
import {AuthenticationManagerService} from "./services/authentication-manager.service";
import {BehaviorSubject, Observable} from "rxjs";
import {Instance} from "./user/instance";
import {Resolvable} from "./types/resolvable";
import {MessageService, MessageType} from "./services/message.service";
import {NotificationType} from "./components/notification/notification.component";
import {NavigationEnd, Router} from "@angular/router";
import {FediseerApiService} from "./services/fediseer-api.service";
import {DOCUMENT} from "@angular/common";
import {environment} from "../environments/environment";
import {ApiResponseHelperService} from "./services/api-response-helper.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected readonly NotificationType = NotificationType;
  protected readonly maintainer: string = environment.maintainer!;

  @ViewChild('sideMenu') private sideMenu: ElementRef<HTMLElement> | null = null;
  @ViewChild('sideMenuToggle') private sideMenuToggle: ElementRef<HTMLAnchorElement> | null = null;

  private autoCollapse = 992;

  public title: string = 'Fediseer';
  public loggedInInstance: Observable<Instance> = this.authenticationManager.currentInstance;

  public errorNotifications: Resolvable<string>[] = [];
  public successNotifications: Resolvable<string>[] = [];
  public warningNotifications: Resolvable<string>[] = [];

  public endorsementsBadgeUrl: string | null = null;
  public guaranteesBadgeUrl: string | null = null;
  public software: string | null = null;

  constructor(
    private readonly titleService: TitleService,
    private readonly authenticationManager: AuthenticationManagerService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly api: FediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.titleChanged.subscribe(title => this.title = title);

    if (window.outerWidth <= this.autoCollapse) {
      await this.toggleSideMenu();
    }

    this.messageService.messageReceived.subscribe(message => {
      switch (message.type) {
        case MessageType.Error:
          this.errorNotifications.push(message.message);
          break;
        case MessageType.Success:
          this.successNotifications.push(message.message);
          break;
        case MessageType.Warning:
          this.warningNotifications.push(message.message);
          break;
      }
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.errorNotifications = [];
        this.successNotifications = [];
        if (window.outerWidth <= this.autoCollapse) {
          this.hideMenu();
        }
      }
    });
    this.authenticationManager.currentInstance.subscribe(instance => {
      if (instance.anonymous) {
        this.endorsementsBadgeUrl = null;
        this.guaranteesBadgeUrl = null;
        return;
      }

      this.endorsementsBadgeUrl = this.api.endorsementsBadgeUrl;
      this.guaranteesBadgeUrl = this.api.guaranteesBadgeUrl;

      this.api.getCurrentInstanceInfo().subscribe(response => {
        if (this.apiResponseHelper.handleErrors([response])) {
          return;
        }

        this.software = response.successResponse!.software.toLowerCase();
      });
    });
  }

  public async logout(): Promise<void> {
    this.authenticationManager.logout();
    await this.router.navigateByUrl('/auth/login');
  }

  public async toggleSideMenu(): Promise<void> {
    const body = this.document.body;
    if (body.classList.contains('sidebar-collapse')) {
      if (window.outerWidth <= this.autoCollapse) {
        body.classList.add('sidebar-open');
      }
      body.classList.remove('sidebar-collapse');
      body.classList.remove('sidebar-closed');
    } else {
      await this.hideMenu();
    }
  }

  @HostListener('body:click', ['$event'])
  public async onBodyClicked(event: Event): Promise<void> {
    if (this.sideMenu === null || this.sideMenuToggle === null) {
      return;
    }
    if (this.sideMenu.nativeElement.contains(<HTMLElement>event.target) || this.sideMenuToggle.nativeElement.contains(<HTMLElement>event.target)) {
      return;
    }
    if (window.outerWidth <= this.autoCollapse) {
      await this.hideMenu();
    }
  }

  private async hideMenu(): Promise<void> {
    const body = this.document.body;
    if (window.outerWidth <= this.autoCollapse) {
      body.classList.remove('sidebar-open');
      body.classList.add('sidebar-closed');
    }
    body.classList.add('sidebar-collapse');
  }
}
