import {SynchronizationSettings} from "./synchronization-settings";

export interface MastodonSynchronizationSettings extends SynchronizationSettings {
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthToken?: string;
  reasonsPublic: boolean;
}
