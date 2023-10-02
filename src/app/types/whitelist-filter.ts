import {int} from "./number";

export interface WhitelistFilter {
  tags?: string[];
  minimumEndorsements?: int;
  minimumGuarantors?: int;
}
