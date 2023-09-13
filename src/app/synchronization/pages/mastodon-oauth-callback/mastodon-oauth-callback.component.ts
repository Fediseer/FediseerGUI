import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {DatabaseService} from "../../../services/database.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "../../../services/message.service";
import {MastodonApiService} from "../../../services/mastodon-api.service";
import {toPromise} from "../../../types/resolvable";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";

export function getMastodonRedirectUri(): string {
  let redirectUri = '';
  if (typeof window !== 'undefined') {
    redirectUri = `${window.location.protocol}//${window.location.host}/synchronize/mastodon/callback`;
  }

  return redirectUri;
}

export const mastodonScopes = [
  'admin:read:domain_allows',
  'admin:read:domain_blocks',
  'admin:write:domain_allows',
  'admin:write:domain_blocks',
];

@Component({
  selector: 'app-mastodon-oauth-callback',
  templateUrl: './mastodon-oauth-callback.component.html',
  styleUrls: ['./mastodon-oauth-callback.component.scss']
})
export class MastodonOauthCallbackComponent implements OnInit {
  public loading = true;

  constructor(
    private readonly titleService: TitleService,
    private readonly database: DatabaseService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly messageService: MessageService,
    private readonly api: MastodonApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Validating code';
    const code: string | undefined = this.activatedRoute.snapshot.queryParams['code'];
    if (!code) {
      this.messageService.createError('No code parameter is specified in the URL.');
      this.loading = false;
      return;
    }

    const settings = this.database.mastodonSynchronizationSettings;

    if (!settings.oauthClientSecret || !settings.oauthClientId) {
      this.messageService.createError('OAuth misconfigured, you must provide client ID and secret.');
      this.loading = false;
      return;
    }

    try {
      const response = await toPromise(this.api.getToken(
        this.authManager.currentInstanceSnapshot.name,
        {
          code: code,
          clientSecret: settings.oauthClientSecret,
          clientId: settings.oauthClientId,
          redirectUri: getMastodonRedirectUri(),
          scope: mastodonScopes,
        }
      ));
      settings.oauthToken = response.access_token;
      this.database.mastodonSynchronizationSettings = settings;
      this.router.navigateByUrl('/synchronize/mastodon').then(() => {
        this.messageService.createSuccess('Successfully logged in!');
      });
    } catch (e) {
      this.messageService.createError('There was an error while exchanging the code for an access token.');
      this.loading = false;
      return;
    }
  }
}
