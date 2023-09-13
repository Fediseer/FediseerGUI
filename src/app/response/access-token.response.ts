import {int} from "../types/number";

export interface AccessTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  scope: string;
  created_at: int;
}
