FROM node:20 as build

ENV NG_CLI_ANALYTICS="false"

COPY . /app
WORKDIR /app
RUN yarn install
RUN yarn build

FROM nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-build.sh /docker-entrypoint.d/99-docker-build.sh
COPY --from=build /app/dist/FediseerGUI/browser /usr/share/nginx/html
