import {Component, ElementRef, HostListener, Inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {TitleService} from "./services/title.service";
import {AuthenticationManagerService} from "./services/authentication-manager.service";
import {debounceTime, Observable} from "rxjs";
import {Instance} from "./user/instance";
import {Resolvable} from "./types/resolvable";
import {MessageService, MessageType} from "./services/message.service";
import {NotificationType} from "./components/notification/notification.component";
import {NavigationEnd, Router} from "@angular/router";
import {FediseerApiService} from "./services/fediseer-api.service";
import {DOCUMENT} from "@angular/common";
import {environment} from "../environments/environment";
import {ApiResponseHelperService} from "./services/api-response-helper.service";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {DatabaseService} from "./services/database.service";
import {TranslocoService} from "@ngneat/transloco";
import {CachedFediseerApiService} from "./services/cached-fediseer-api.service";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected readonly NotificationType = NotificationType;
  protected readonly maintainer: string = environment.maintainer!;
  protected readonly appVersion: string = environment.appVersion;
  protected readonly sourceCodeLink: string = environment.sourceCodeLink;
  protected readonly donateLink: string = environment.donateLink;

  @ViewChild('sideMenu') private sideMenu: ElementRef<HTMLElement> | null = null;
  @ViewChild('sideMenuToggle') private sideMenuToggle: ElementRef<HTMLAnchorElement> | null = null;
  @ViewChild('searchWrapper') private searchWrapper: ElementRef<HTMLDivElement> | null = null;

  private switchAccountModal: NgbModalRef | null = null;

  private autoCollapse = 992;

  public darkModeEnabled: boolean = false;
  public title: string = 'Fediseer';
  public loggedInInstance: Observable<Instance> = this.authenticationManager.currentInstance;

  public errorNotifications: Resolvable<string>[] = [];
  public successNotifications: Resolvable<string>[] = [];
  public warningNotifications: Resolvable<string>[] = [];

  public endorsementsBadgeUrl: string | null = null;
  public guaranteesBadgeUrl: string | null = null;
  public software: string | null = null;
  public maintainerLink: string | null = null;
  public availableAccounts: Observable<Instance[]> = this.database.availableAccountsObservable;

  public availableLanguages: string[] = [];
  public selectedLanguage: string | null = null;

  public searchFocused: boolean = false;
  public searchResults: {[instance: string]: {title: string, link: string}} = {};
  public searchForm = new FormGroup({
    searchContent: new FormControl(''),
  });

  constructor(
    private readonly titleService: TitleService,
    private readonly authenticationManager: AuthenticationManagerService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly api: FediseerApiService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly modalService: NgbModal,
    private readonly database: DatabaseService,
    private readonly transloco: TranslocoService,
    private readonly cachedApi: CachedFediseerApiService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.titleChanged.subscribe(title => this.title = title);

    this.availableLanguages = this.transloco.getAvailableLangs().map(value => typeof value === 'string' ? value : value.id);
    if (this.database.storedLanguage) {
      this.transloco.setActiveLang(this.database.storedLanguage);
      this.selectedLanguage = this.database.storedLanguage;
    } else if (typeof navigator !== 'undefined') {
      for (const language of navigator.languages.map(language => language.split("-")[0])) {
        if (this.availableLanguages.includes(language)) {
          this.transloco.setActiveLang(language);
          this.selectedLanguage = language;
          break;
        }
      }
    }
    this.selectedLanguage ??= this.transloco.config.defaultLang;

    const darkModeDetected = typeof window === 'undefined' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (darkModeDetected) {
      this.document.body.classList.add('dark-mode');
    } else {
      this.document.body.classList.remove('dark-mode');
    }
    this.darkModeEnabled = darkModeDetected;

    this.createMaintainerLink();

    if (typeof window !== 'undefined' && window.outerWidth <= this.autoCollapse) {
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
        if (typeof window !== 'undefined' && window.outerWidth <= this.autoCollapse) {
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

      this.cachedApi.getCurrentInstanceInfo(null, {clear: true}).subscribe(response => {
        if (this.apiResponseHelper.handleErrors([response])) {
          return;
        }

        this.software = response.successResponse!.software.toLowerCase();
      });
    });

    this.searchForm.controls.searchContent.valueChanges.pipe(
      debounceTime(300),
    ).subscribe(async searchText => {
      this.searchResults = {};
      if (!searchText) {
        return;
      }

      this.cachedApi.getAllInstances({ttl: 3600}).subscribe(instancesResponse => {
        if (this.apiResponseHelper.handleErrors([instancesResponse])) {
          return;
        }

        const instances = instancesResponse.successResponse!.instances.filter(
          instance => instance.domain.includes(searchText),
        );

        for (const instance of instances) {
          this.searchResults[instance.domain] = {
            title: instance.domain,
            link: `/instances/detail/${instance.domain}`
          };
        }
      });
    });
  }

  public async logout(removeFromAccounts: boolean = true): Promise<void> {
    if (removeFromAccounts) {
      this.database.removeAvailableAccount(this.authenticationManager.currentInstanceSnapshot);
    }
    this.cachedApi.clearCache();
    this.authenticationManager.logout();
    this.switchAccountModal?.close();
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
    if (this.sideMenu !== null && this.sideMenuToggle !== null) {
      if (this.sideMenu.nativeElement.contains(<HTMLElement>event.target) || this.sideMenuToggle.nativeElement.contains(<HTMLElement>event.target)) {
        return;
      }
      if (window.outerWidth <= this.autoCollapse) {
        await this.hideMenu();
      }
    }
    if (this.searchWrapper !== null) {
      if (this.searchWrapper.nativeElement.contains(<HTMLElement>event.target)) {
        return;
      }
      this.searchFocused = false;
    }
  }

  @HostListener('document:keydown.escape')
  public onEscapePressed() {
    this.searchFocused = false;
  }

  private async hideMenu(): Promise<void> {
    const body = this.document.body;
    if (window.outerWidth <= this.autoCollapse) {
      body.classList.remove('sidebar-open');
      body.classList.add('sidebar-closed');
    }
    body.classList.add('sidebar-collapse');
  }

  private createMaintainerLink(): void {
    const normalized = this.maintainer.startsWith('@') ? this.maintainer.substring(1) : this.maintainer;
    const urlized = new URL(`https://${normalized}`);
    const username = urlized.username;
    const host = urlized.host;

    this.maintainerLink = `https://lemmyverse.link/u/${username}@${host}`;
  }

  public async openSwitchAccountModal(modal: TemplateRef<any>) {
    try {
      this.switchAccountModal = this.modalService.open(modal, {ariaLabelledBy: 'modal-basic-title', windowClass: 'switchAccountModal'});
      await this.switchAccountModal.result;
      this.switchAccountModal = null;
    } catch (e) {
      // ignore, the exception is thrown when modal is dismissed
      this.switchAccountModal = null;
    }
  }

  public switchToInstance(instance: Instance): void {
    this.authenticationManager.currentInstance = instance;
    this.switchAccountModal?.close();
    this.cachedApi.getCurrentInstanceInfo(null, {clear: true});
    this.router.navigateByUrl('/');
  }

  public logoutFrom(instance: Instance) {
    this.database.removeAvailableAccount(instance);
    if (instance.name === this.authenticationManager.currentInstanceSnapshot.name) {
      this.logout();
    }
  }

  public changeLanguage(language: string) {
    this.transloco.setActiveLang(language);
    this.database.storedLanguage = language;
  }

  public async searchAnywhere(searchText: string) {

  }
}
