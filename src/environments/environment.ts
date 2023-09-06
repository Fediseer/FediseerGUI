export const environment = {
  apiUrl: process.env['FEDISEER_API_URL'] ?? 'https://fediseer.com/api',
  apiVersion: process.env['FEDISEER_API_VERSION'] ?? 'v1',
  appName: process.env['FEDISEER_GUI_APP_NAME'] ?? 'FediseerGUI',
  appVersion: process.env['FEDISEER_GUI_APP_VERSION'],
  maintainer: process.env['FEDISEER_GUI_APP_MAINTAINER'],
};
