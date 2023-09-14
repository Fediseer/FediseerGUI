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
    public censuresEvidence: string,
    public hesitationReasons: string[],
    public unmergedHesitationReasons: string[],
    public hesitationsEvidence: string,
    public endorsementReasons: string[],
    public unmergedEndorsementReasons: string[],
    public sysadmins: int | null,
    public moderators: int | null,
    public guarantor?: string | null,
  ) {
  }

  public static fromInstanceDetail(detail: InstanceDetailResponse): NormalizedInstanceDetailResponse {
    let censureReasons: string[] = [];
    let unmergedCensureReasons: string[] = [];
    let hesitationReasons: string[] = [];
    let unmergedHesitationReasons: string[] = []
    let endorsementReasons: string[] = [];
    let unmergedEndorsementReasons: string[] = [];

    if (detail.censure_reasons) {
      [censureReasons, unmergedCensureReasons] = this.getReasons(detail.censure_reasons);
    }
    if (detail.hesitation_reasons) {
      [hesitationReasons, unmergedHesitationReasons] = this.getReasons(detail.hesitation_reasons);
    }
    if (detail.endorsement_reasons) {
      [endorsementReasons, unmergedEndorsementReasons] = this.getReasons(detail.endorsement_reasons);
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
      unmergedCensureReasons,
      detail.censure_evidence?.join(', ') ?? '',
      hesitationReasons,
      unmergedHesitationReasons,
      detail.hesitation_evidence?.join(', ') ?? '',
      endorsementReasons,
      unmergedEndorsementReasons,
      detail.sysadmins,
      detail.moderators,
      detail.guarantor,
    );
  }

  private static getReasons(source: string[]): [string[], string[]] {
    let allReasons: string[] = [];
    for (const reasonCsv of source) {
      const reasons = reasonCsv.split(',').map(reason => reason.trim().toLowerCase());
      allReasons = [...allReasons, ...reasons];
    }

    const reasonCounts: { [reason: string]: int } = {};
    for (const reason of allReasons) {
      reasonCounts[reason] ??= 0;
      ++reasonCounts[reason];
    }
    const unmerged = [...allReasons];
    allReasons = [];
    for (const reason of Object.keys(reasonCounts)) {
      if (reasonCounts[reason] > 1) {
        allReasons.push(`${reason} (${reasonCounts[reason]}x)`);
      } else {
        allReasons.push(reason);
      }
    }

    return [allReasons, unmerged];
  }
}
