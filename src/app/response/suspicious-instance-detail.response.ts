import {float, int} from "../types/number";

export interface SuspiciousInstanceDetailResponse {
  domain: string;
  uptime_alltime: float;
  local_posts: int;
  comment_counts: int;
  total_users: int;
  active_users_monthly: int;
  signup: boolean;
  activity_suspicion: float;
  active_users_suspicion: int;
}
