import {Injectable} from '@angular/core';
import {EMPTY, expand, Observable, reduce} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {AccessTokenResponse} from "../response/access-token.response";
import {MastodonBlacklistItem, MastodonBlacklistResponse} from "../response/mastodon-blacklist.response";
import {MastodonDomainBlacklistRequest} from "../types/mastodon-domain-blacklist-request";
import {MastodonLinkParserService} from "./mastodon-link-parser.service";

export interface GetTokenOptions {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MastodonApiService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly mastodonLinkParser: MastodonLinkParserService,
  ) {
  }

  public getToken(instance: string, options: GetTokenOptions): Observable<AccessTokenResponse> {
    const url = `https://${instance}/oauth/token`;
    const formData = new FormData();
    formData.set('grant_type', 'authorization_code');
    formData.set('code', options.code);
    formData.set('client_id', options.clientId);
    formData.set('client_secret', options.clientSecret);
    formData.set('redirect_uri', options.redirectUri);
    formData.set('scope', options.scope.join(' '));

    return this.httpClient.post<AccessTokenResponse>(url, formData);
  }

  public getBlacklist(instance: string, token: string): Observable<MastodonBlacklistResponse> {
    const url = `https://${instance}/api/v1/admin/domain_blocks`;

    return this.httpClient.get<MastodonBlacklistResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      observe: 'response'
    }).pipe(
      expand(response => {
        if (response.headers.has('Link')) {
          const links = this.mastodonLinkParser.getLinks(response.headers.get('Link')!);
          if (links.next === undefined) {
            return EMPTY;
          }

          return this.httpClient.get<MastodonBlacklistResponse>(links.next, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            observe: 'response',
          });
        }

        return EMPTY;
      }),
      reduce((acc, value) => acc.concat(value.body!), <MastodonBlacklistResponse>[]),
    )
  }

  public blacklistInstance(
    instance: string,
    token: string,
    instanceToBlacklist: string,
    options: MastodonDomainBlacklistRequest = {}
  ): Observable<MastodonBlacklistItem> {
    const url = `https://${instance}/api/v1/admin/domain_blocks`;

    return this.httpClient.post<MastodonBlacklistItem>(url, {...options, domain: instanceToBlacklist}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  public deleteBlacklist(instance: string, token: string, instanceId: string) {
    const url = `https://${instance}/api/v1/admin/domain_blocks/${instanceId}`;
    return this.httpClient.delete<{}>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
