# Frontend for Fediseer

## Running

- edit [environment.ts](src/environments/environment.ts) to your liking
  - especially change the maintainer, please
- `yarn install`
  - to install dependencies
- `yarn build`
  - to build the app
- copy contents of `dist/FediseerGUI/browser` to your favorite webserver
- configure your webserver to route all pages to `index.html`

> You can build the app using a single docker command:
> `docker run --rm -v $(pwd):/app -w /app -u $(id -u):$(id -g) node:18 bash -c 'yarn install && yarn build'`

## Running with server side rendering

- edit [environment.ts](src/environments/environment.ts) to your liking
  - especially change the maintainer, please
- `yarn install`
  - to install dependencies
- `yarn build:ssr`
  - to build the app, both client and server
- copy contents of `dist/FediseerGUI` to your server
- `node dist/FediseerGUI/server/main.js`
  - runs the node express server (replace with real path to your dir)
- configure your reverse proxy to route to localhost:4000

## Running using Docker

A ready-to-use docker image is available as [`ghcr.io/fediseer/fediseer-gui`](https://ghcr.io/fediseer/fediseer-gui).

Configuration is done using environment variables.

| Environment variable                           | Description                                                                                                                                                                                                              | Default value                                                           |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| FEDISEER_API_URL                               | The URL of the Fediseer api.                                                                                                                                                                                             | https://fediseer.com/api                                                |
| FEDISEER_API_VERSION                           | The api version of the Fediseer api.                                                                                                                                                                                     | v1                                                                      |
| FEDISEER_APP_NAME                              | The internal app name used.                                                                                                                                                                                              | FediseerGUI                                                             |
| FEDISEER_APP_MAINTAINER                        | The name of the maintainer in the format of @[username]@[instance]. **This variable cannot be empty**.                                                                                                                   | `none`                                                                  |
| FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES | The default instances to use in the censure list filters. List them as a comma separated values, for example `lemmings.world,lemmy.dbzer0.com`. The special value `__all__` can be used to mean all guaranteed instances | \_\_all__                                                               |
| FEDISEER_SOURCE_CODE_LINK                      | The URL to the source code repository. You may want to set it to your fork URL if you're not using my version.                                                                                                           | https://github.com/Fediseer/FediseerGUI                                 |
| FEDISEER_APP_VERSION                           | The current version of the Fediseer GUI.                                                                                                                                                                                 | gets the default from [environment.ts](src/environments/environment.ts) |
| FEDISEER_ENABLE_SSR                            | Set to any value to enable server-side rendering                                                                                                                                                                         | `none`                                                                  |
| FEDISEER_DONATE_LINK                           | The link to the donation page, can be anything                                                                                                                                                                           | https://liberapay.com/Fediseer/                                         |

The app is running on port 80 inside the container.
