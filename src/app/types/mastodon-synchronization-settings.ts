import {SynchronizationSettings} from "./synchronization-settings";
import {MastodonBlocklistSeverity} from "../response/mastodon-blocklist.response";

export interface MastodonSynchronizationSettings extends SynchronizationSettings {
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthToken?: string;
  reasonsPublic: boolean;
  censuresMode: MastodonBlocklistSeverity;
  hesitationsMode: MastodonBlocklistSeverity;
}
