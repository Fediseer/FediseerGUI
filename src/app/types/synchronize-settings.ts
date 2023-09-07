export enum SynchronizationMode {
  Own = 'own',
  Endorsed = 'endorsed',
}

export interface SynchronizeSettings {
  username: string;
  mode: SynchronizationMode;
  purge: boolean;
}
