export enum SynchronizationMode {
  Own = 'own',
  Endorsed = 'endorsed',
  All = 'all',
}

export interface SynchronizeSettings {
  username: string;
  mode: SynchronizationMode;
  purge: boolean;
}
