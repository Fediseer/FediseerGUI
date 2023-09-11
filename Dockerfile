FROM nginx

RUN apt-get update && \
    apt-get -y install nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm install --global yarn

ENV NG_CLI_ANALYTICS="false"

COPY . /app
WORKDIR /app
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-build.sh /docker-entrypoint.d/99-docker-build.sh

RUN yarn install
