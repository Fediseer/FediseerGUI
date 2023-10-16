export enum MastodonBlocklistSeverity {
  Silence = "silence",
  Suspend = "suspend",
  RejectMedia = "noop",
  Nothing = '',
}

export interface MastodonBlocklistItem {
  id: string;
  domain: string;
  created_at: string;
  severity: MastodonBlocklistSeverity;
  reject_media: boolean;
  reject_reports: boolean;
  private_comment: string | null;
  public_comment: string | null;
  obfuscate: boolean;
}

export type MastodonBlocklistResponse = MastodonBlocklistItem[];
