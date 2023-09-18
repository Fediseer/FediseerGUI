import {ListVisibility} from "./list-visibility";

export interface EditableInstanceData {
  sysadmins?: number | null;
  moderators?: number | null;
  visibility_endorsements?: ListVisibility;
  visibility_censures?: ListVisibility;
  visibility_hesitations?: ListVisibility;
}
