import {InstanceDetailResponse} from "./instance-detail.response";

export interface SolicitationInstanceDetailResponse extends InstanceDetailResponse {
  comment: string | null;
}
