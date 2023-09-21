ORIGINAL_DIR=$(pwd)

if [ -z ${FEDISEER_API_URL+x} ]; then
  FEDISEER_API_URL=https://fediseer.com/api
fi
if [ -z ${FEDISEER_API_VERSION+x} ]; then
  FEDISEER_API_VERSION=v1
fi
if [ -z ${FEDISEER_APP_NAME+x} ]; then
  FEDISEER_APP_NAME=FediseerGUI
fi
if [ -z ${FEDISEER_APP_MAINTAINER+x} ]; then
  echo "Maintainer must be specified using the FEDISEER_APP_MAINTAINER env variable."
  exit 1
fi
if [ -z ${FEDISEER_APP_MAINTAINER+x} ]; then
  echo "Maintainer must be specified using the FEDISEER_APP_MAINTAINER env variable."
  exit 1
fi
if [ -z ${FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES+x} ]; then
  FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES=__all__
fi
if [ -z ${FEDISEER_SOURCE_CODE_LINK+x} ]; then
  FEDISEER_SOURCE_CODE_LINK=https://github.com/Fediseer/FediseerGUI
fi
if [ -z ${FEDISEER_APP_VERSION+x} ]; then
  FEDISEER_APP_VERSION=$(grep appVersion src/environments/environment.ts | cut -c16-50 | rev | cut -c3- | rev)
fi
if [ -z ${FEDISEER_DONATE_LINK+x} ]; then
  FEDISEER_DONATE_LINK=https://liberapay.com/Fediseer/
fi

OLD_IFS=$IFS
FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES_RESULT='['
IFS=','
for INSTANCE in $FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES; do
  FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES_RESULT="$FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES_RESULT '$INSTANCE',"
done
FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES_RESULT="$FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES_RESULT]"
IFS=$OLD_IFS

JSON="{apiUrl: '$FEDISEER_API_URL', apiVersion: '$FEDISEER_API_VERSION', appName: '$FEDISEER_APP_NAME', appVersion: '$FEDISEER_APP_VERSION', maintainer: '$FEDISEER_APP_MAINTAINER', sourceCodeLink: '$FEDISEER_SOURCE_CODE_LINK', defaultCensuresListInstanceFilter: $FEDISEER_DEFAULT_CENSURE_LIST_FILTER_INSTANCES_RESULT, donateLink: '$FEDISEER_DONATE_LINK', production: true}";

echo "export const environment = $JSON;" > src/environments/environment.ts

cd /app
if [ -z ${FEDISEER_ENABLE_SSR+x} ]; then
  yarn build && mv dist/FediseerGUI/browser/* /usr/share/nginx/html
else
  cp nginx-proxy.conf /etc/nginx/conf.d/default.conf
  yarn build:ssr && node dist/FediseerGUI/server/main.js &
fi

cd "$ORIGINAL_DIR"
