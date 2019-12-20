FROM node:alpine

LABEL maintainer="Bernard Okoth <bernardo@sonkomail.com>"
LABEL version="0.1.0"

RUN apk update
RUN apk upgrade
RUN apk add bash

#  && apk add --no-cache bash openssh-client git \
#  && apk add --no-cache --virtual .build-dependencies curl wget tar

WORKDIR /src

COPY src .
COPY package_json.json package.json
COPY docker_entrypoint.sh .
#COPY --chown=caddy:caddy startup/caddy_entrypoint.sh /opt/caddy_entrypoint.sh
RUN chmod ug+rx /src/docker_entrypoint.sh

#RUN ls -ltra .

RUN npm install

# set a health check
#HEALTHCHECK --interval=5s \
#            --timeout=5s \
#            CMD curl -f http://127.0.0.1:8000 || exit 1

#ENTRYPOINT ["nodejs"]
ENTRYPOINT ["/src/docker_entrypoint.sh"]
