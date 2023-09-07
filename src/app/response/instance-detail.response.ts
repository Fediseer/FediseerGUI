import {int} from "../types/number";

export interface InstanceDetailResponse {
  id: int;
  domain: string;
  software: string;
  claimed: int;
  open_registrations: boolean;
  email_verify: boolean;
  approvals: int;
  endorsements: int;
  guarantor?: string | null;
  censure_reasons?: string[];
}
