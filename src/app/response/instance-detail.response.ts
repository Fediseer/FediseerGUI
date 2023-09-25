import {int} from "../types/number";
import {ListVisibility} from "../types/list-visibility";
import {InstanceStatus} from "../types/instance-status";

export interface InstanceDetailResponse {
  id: int;
  domain: string;
  software: string;
  claimed: int;
  open_registrations: boolean;
  email_verify: boolean | null;
  has_captcha: boolean | null;
  approval_required: boolean | null;
  approvals: int;
  endorsements: int;
  guarantor?: string | null;
  censure_reasons?: string[] | null;
  sysadmins: int | null;
  moderators: int | null;
  censure_evidence?: string[];
  hesitation_reasons?: string[];
  hesitation_evidence?: string[];
  endorsement_reasons?: string[] | null;
  visibility_endorsements?: ListVisibility;
  visibility_censures?: ListVisibility;
  visibility_hesitations?: ListVisibility;
  state: InstanceStatus;
}
