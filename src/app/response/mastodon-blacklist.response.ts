export enum MastodonBlacklistSeverity {
  Silence = "silence",
  Suspend = "suspend",
  RejectMedia = "noop",
  Nothing = '',
}

export interface MastodonBlacklistItem {
  id: string;
  domain: string;
  created_at: string;
  severity: MastodonBlacklistSeverity;
  reject_media: boolean;
  reject_reports: boolean;
  private_comment: string | null;
  public_comment: string | null;
  obfuscate: boolean;
}

export type MastodonBlacklistResponse = MastodonBlacklistItem[];
