import {SynchronizationSettings} from "./synchronization-settings";
import {MastodonBlacklistSeverity} from "../response/mastodon-blacklist.response";

export interface MastodonSynchronizationSettings extends SynchronizationSettings {
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthToken?: string;
  reasonsPublic: boolean;
  censuresMode: MastodonBlacklistSeverity;
  hesitationsMode: MastodonBlacklistSeverity;
}
