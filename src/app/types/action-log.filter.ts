import {ActionLogReportActivity, ActionLogReportType} from "../response/action-log.response";

export interface ActionLogFilter {
  sourceDomains?: string[];
  targetDomains?: string[];
  type?: ActionLogReportType;
  activity?: ActionLogReportActivity;
}
