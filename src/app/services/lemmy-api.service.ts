import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {FederatedInstancesResponse} from "../response/federated-instances.response";
import {GetFederatedInstancesResponse} from "../response/get-federated-instances.response";
import {LemmyLoginResponse} from "../response/lemmy-login-response";
import {GetSiteResponse} from "../response/get-site.response";

@Injectable({
  providedIn: 'root'
})
export class LemmyApiService {
  constructor(
    private readonly httpClient: HttpClient,
  ) {
  }

  public getBlockedInstances(instance: string): Observable<string[]> {
    const url = `https://${instance}/api/v3/federated_instances`;

    return this.httpClient.get<GetFederatedInstancesResponse>(url).pipe(
      map (response => {
        return response.federated_instances?.blocked.map(instance => instance.domain) ?? [];
      }),
    );
  }

  public login(instance: string, username: string, password: string, totpToken: string | null = null): Observable<string> {
    const url = `https://${instance}/api/v3/user/login`;

    const body: {[key: string]: string} = {
      username_or_email: username,
      password: password,
    };
    if (totpToken !== null) {
      body['totp_2fa_token'] = totpToken;
    }

    return this.httpClient.post<LemmyLoginResponse>(url, body).pipe(
      map (response => response.jwt),
    );
  }

  public isCurrentUserAdmin(instance: string, jwt: string): Observable<boolean> {
    const url = `https://${instance}/api/v3/site?auth=${jwt}`;

    return this.httpClient.get<GetSiteResponse>(url).pipe(
      map (response => {
        const currentUsername = response.my_user.local_user_view.person.name;
        const admins = response.admins.map(user => user.person.name);

        return admins.indexOf(currentUsername) > -1;
      }),
    );
  }

  public updateBlacklist(instance: string, jwt: string, newInstancesToBlock: string[]): Observable<void> {
    const url = `https://${instance}/api/v3/site`;

    return this.httpClient.put(url, {
      blocked_instances: newInstancesToBlock,
      auth: jwt,
    }).pipe(map(() => {return}));
  }
}
