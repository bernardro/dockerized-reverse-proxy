FROM golang:1.13.5-alpine as builder

WORKDIR /src

RUN apk add --no-cache \
    git \
    ca-certificates

ARG CADDY_SOURCE_VERSION
RUN git clone -b $CADDY_SOURCE_VERSION https://github.com/caddyserver/caddy.git --depth 1

WORKDIR /src/caddy/cmd/caddy

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -tags netgo -ldflags '-extldflags "-static" -s -w' -o /usr/bin/caddy

#######################################################################
#######################################################################
FROM alpine:3.11.0 AS alpine

RUN addgroup -S caddy \
    && adduser -SD -h /var/lib/caddy/ -g 'Caddy web server' -s /sbin/nologin -G caddy caddy

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs

ARG XDG_DATA_HOME

RUN mkdir -p ${XDG_DATA_HOME}
RUN chown -R caddy:caddy ${XDG_DATA_HOME}
RUN chmod -R ug+rx ${XDG_DATA_HOME}

ENTRYPOINT ["caddy"]

#######################################################################
#######################################################################
FROM scratch AS scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

COPY --from=alpine /etc/passwd /etc/passwd
COPY --from=alpine /etc/group /etc/group
COPY --from=alpine --chown=caddy:caddy /var/lib/caddy /var/lib/caddy

USER caddy

#VOLUME /var/lib/caddy/.local/share/caddy

ENTRYPOINT ["caddy"]
