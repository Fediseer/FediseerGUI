import {FilterSpecialValueAllInstances} from "../app/shared/constants";

function getEnvironmentVariable<T>(variable: string, defaultValue: T): T {
  if (typeof (<any>window)[variable] === 'undefined') {
    return defaultValue;
  }

  return <T>(<any>window)[variable];
}

export const environment = {
  apiUrl: getEnvironmentVariable('FEDISEER_API_URL', 'https://fediseer.com/api'),
  apiVersion: getEnvironmentVariable('FEDISEER_API_VERSION', 'v1'),
  appName: getEnvironmentVariable('FEDISEER_APP_NAME', 'FediseerGUI'),
  appVersion: getEnvironmentVariable('FEDISEER_APP_VERSION', '0.18.3'),
  maintainer: getEnvironmentVariable('FEDISEER_APP_MAINTAINER', '@rikudou@lemmings.world'),
  defaultCensuresListInstanceFilter: getEnvironmentVariable('FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES', [FilterSpecialValueAllInstances]),
  sourceCodeLink: getEnvironmentVariable('FEDISEER_SOURCE_CODE_LINK', 'https://github.com/Fediseer/FediseerGUI'),
  donateLink: getEnvironmentVariable('FEDISEER_DONATE_LINK', 'https://liberapay.com/Fediseer/'),
  production: true,
};
