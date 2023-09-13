import {MastodonBlacklistSeverity} from "../response/mastodon-blacklist.response";

export interface MastodonDomainBlacklistRequest {
  severity?: MastodonBlacklistSeverity;
  reject_media?: boolean;
  reject_reports?: boolean;
  private_comment?: string;
  public_comment?: string;
  obfuscate?: boolean;
}
