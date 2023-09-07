import {float, int} from "../types/number";

export interface BlacklistedInstanceDetailResponse {
  domain: string;
  uptime_alltime: float;
  local_posts: int;
  comments_count: int;
  total_users: int;
  active_users_monthly: int;
  signup: boolean;
  activity_suspicion: float;
  active_users_suspicion: int;
}
