export enum SynchronizationMode {
  Own = 'own',
  Endorsed = 'endorsed',
  CustomInstances = 'custom',
}

export interface SynchronizeSettings {
  username: string;
  mode: SynchronizationMode;
  purge: boolean;
  customInstances: string[];
  filterByReasons: boolean;
  reasonsFilter: string[];
  includeHesitations: boolean,
}
