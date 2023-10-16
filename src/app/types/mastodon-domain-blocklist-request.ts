import {MastodonBlocklistSeverity} from "../response/mastodon-blocklist.response";

export interface MastodonDomainBlocklistRequest {
  severity?: MastodonBlocklistSeverity;
  reject_media?: boolean;
  reject_reports?: boolean;
  private_comment?: string;
  public_comment?: string;
  obfuscate?: boolean;
}
