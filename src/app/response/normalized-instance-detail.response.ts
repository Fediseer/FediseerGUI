import {int} from "../types/number";
import {InstanceDetailResponse} from "./instance-detail.response";

export class NormalizedInstanceDetailResponse {
  constructor(
    public id: int,
    public domain: string,
    public software: string,
    public claimed: int,
    public openRegistrations: boolean,
    public emailVerify: boolean,
    public approvals: int,
    public endorsements: int,
    public censureReasons: string[],
    public unmergedCensureReasons: string[],
    public evidence: string,
    public guarantor?: string | null,
  ) {
  }

  public static fromInstanceDetail(detail: InstanceDetailResponse): NormalizedInstanceDetailResponse {
    let censureReasons: string[] = [];
    if (detail.censure_reasons) {
      for (const reasonCsv of detail.censure_reasons) {
        const reasons = reasonCsv.split(',').map(reason => reason.trim().toLowerCase());
        censureReasons = [...censureReasons, ...reasons];
      }
    }

    const reasonCounts: {[reason: string]: int} = {};
    for (const reason of censureReasons) {
      reasonCounts[reason] ??= 0;
      ++reasonCounts[reason];
    }
    const unmerged = [...censureReasons];
    censureReasons = [];
    for (const reason of Object.keys(reasonCounts)) {
      if (reasonCounts[reason] > 1) {
        censureReasons.push(`${reason} (${reasonCounts[reason]}x)`);
      } else {
        censureReasons.push(reason);
      }
    }

    return new NormalizedInstanceDetailResponse(
      detail.id,
      detail.domain,
      detail.software,
      detail.claimed,
      detail.open_registrations,
      detail.email_verify,
      detail.approvals,
      detail.endorsements,
      censureReasons,
      unmerged,
      detail.censure_evidence.join(', '),
      detail.guarantor,
    );
  }
}
