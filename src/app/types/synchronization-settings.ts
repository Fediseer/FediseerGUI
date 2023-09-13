import {SynchronizationMode} from "./synchronization-mode";

export interface SynchronizationSettings {
  mode: SynchronizationMode;
  purge: boolean;
  customInstances: string[];
  filterByReasons: boolean;
  reasonsFilter: string[];
  includeHesitations: boolean;
  ignoreInstances: boolean;
  ignoreInstanceList: string[];
}
