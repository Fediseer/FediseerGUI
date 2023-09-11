# Frontend for Fediseer

Building:

- edit [environment.ts](src/environments/environment.ts) to your liking
  - especially change the maintainer, please
- `yarn install`
  - to install dependencies
- `yarn build`
  - to build the app
- copy contents of `dist/fediseer-gui` to your favorite webserver
- configure your webserver to route all pages to `index.html`

> You can build the app using a single docker command:
> `docker run --rm -v $(pwd):/app -w /app -u $(id -u):$(id -g) node:18 bash -c 'yarn install && yarn build'`
