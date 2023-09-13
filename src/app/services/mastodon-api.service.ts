import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {AccessTokenResponse} from "../response/access-token.response";
import {MastodonBlacklistItem, MastodonBlacklistResponse} from "../response/mastodon-blacklist.response";
import {MastodonDomainBlacklistRequest} from "../types/mastodon-domain-blacklist-request";

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
    });
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
