export enum ActionLogReportType {
  Censure = 'CENSURE',
  Endorsement = 'ENDORSEMENT',
  Hesitation = 'HESITATION',
  Guarantee = 'GUARANTEE',
  Claim = 'CLAIM',
  Solicitation = 'SOLICITATION',
  Rebuttal = 'REBUTTAL',
}

export enum ActionLogReportActivity {
  Added = 'ADDED',
  Deleted = 'DELETED',
  Modified = 'MODIFIED',
}

export interface ActionLogItem {
  source_domain: string;
  target_domain: string;
  report_type: ActionLogReportType;
  report_activity: ActionLogReportActivity;
  created: string;
}

export type ActionLogResponse = ActionLogItem[];
