import {int} from "../types/number";

export interface FediseerConfigResponse {
  max_guarantees: int;
  max_guarantors: int;
  max_config_actions_per_min: int;
  max_tags: int;
}
