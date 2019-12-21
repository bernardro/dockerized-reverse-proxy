# Caddy reverse proxy - Dockerized

## rationale
The main aim of this project is to be able to **host** multiple domains on ANY of the cheap hosting 
providers such as digital ocean through a simple deployment process

The process should be similar to this:
- Buy a domain and point it to your digital ocean server (single IP address)
- The domain could take as little as 10 minutes to resolve depending on your location 
- While that is happening you prepare your application by dockerizing it
- You upload your dockerized service to digital ocean (or other) service and run `sudo docker-compose up -d` on it
- If it is propertly **labelled** this service manager will recognize it, and reverse proxy it with no work on your part
- As soon as your new domain resolves your service should be online and reachable from any browser

Obviously this project is currently only for MVP, hobby type projects and is not intended for production workloads or security sensitive projects

## Current features
- Uses Docker engine SDK and API to detect when a Docker service is already running or being stood up/down
- Currently targeting Caddy server v2
- Leverages docker-compose to package services
- Shows a default static page when there are no services being reverse proxy'd
- Leverages the power of Docker to host services based on disparate tech stacks on a single (digital ocean) droplet
- Leverages Caddy's automatic https feature that automatically fetches certificates for your domain from Let's Encrypt
- Terminates TLS at the Caddy boundary so that your backend LAN can run on plain http
- Allows you to move all your services to a different host by uploading a small zip file (your dockerized code) and repointing your domains

## Future features
- Provide the option to use Nginx instead of Caddy. Nginx currently beats Caddy by about 4x on various performance
 benchmarks; but then again the Caddy developers have not spent any time optimizing the yet to be released Caddy V2 
- Explore Docker's (limited) scaling features
- Explore Docker's (limited) load balancing features
- Explore running this infrastructure on Kubernetes 
- Run Docker in rootless mode ( introduced in Docker Engine 19.03)

## Notes
- Requires hosted services to be packaged with docker compose and properly **labelled**; something similar to this:

```yaml
# docker-compose.yml
    ...
    command: ["/src/main.js"]
    labels:
      - "virtual.server=nodebasic"  # Docker host
      - "virtual.host=karamba.com"  # your domains separated with a space
      - "virtual.alias=www.karamba.com"  # alias for your domain (optional) separated with a space
      - "virtual.port=${NODE_SVR_PORT}"  # exposed port of this container
      - "virtual.tls-email=your@tlsworthyemail.com"  # ssl is now on
      - "virtual.websockets" # enable websocket passthrough
      - "virtual.autohttps=false" # enable caddy automatic https
    ...
```
