import {int} from "./number";

export interface SafelistFilter {
  tags?: string[];
  minimumEndorsements?: int;
  minimumGuarantors?: int;
}
