const request = require('request');
const dockerUtils = require('./utils_docker');


exports.updateCaddyCfg = (serversCnfg, showDbgLogs, CADDY_ADMIN) => {
    const opts = {
        baseUrl: `http://${CADDY_ADMIN.HOST}:${CADDY_ADMIN.PORT}`,
        url: '/config/apps/http/servers',
        body: serversCnfg,
        json: true,
        followRedirect: false,
        timeout: CADDY_ADMIN.TIMEOUT_MS,
    };

    request.post(opts, (error, response, body) => {
        if (error) {
            throw new Error(`during post request - error [${error}]`);
        }

        if (response.statusCode === 200) {
            exports.logSvrConfig(serversCnfg, showDbgLogs);
        } else {
            throw new Error(`during post request - status code [${response.statusCode}] body [${body}]`);
        }
    });
};

exports.getPrxySvrRoutes = (containers, REQUIRED_LBLS, evtInfo) => {
    const svrConfigs = [];

    for (const container of containers) {
        // check if event is about to bring this container down
        if (!exports.skipContainer(container.Id, evtInfo)) {
            // if container going down leave it out of the new config

            const labels = container.Labels;
            const reqLabelsFound = exports.isMinimumLabelsFound(labels, REQUIRED_LBLS);
            if (reqLabelsFound) {
                const rvsConfig = exports.getRvsCfg(labels);

                // append to new caddy config
                svrConfigs.push(rvsConfig);
            }
        }
    }

    return svrConfigs;
};

exports.logSvrConfig = (svrsJson, showDetail) => {
    const svrKeys = Object.keys(svrsJson);

    if (svrKeys.length > 0) {
        console.info(`new config has ${svrKeys.length} server(s)...`);

        if (showDetail) {
            for (const kee of svrKeys) {
                const svrCfg = svrsJson[kee];
                console.info(`[${kee}] responding to ${svrCfg.listen[0]} from routes:`);

                if (svrCfg.routes) {
                    for (let ndx = 0; ndx < svrCfg.routes.length; ndx++) {
                        const route = svrCfg.routes[ndx];

                        const host = (route.match) ? route.match[0].host[0] : 'ALL';
                        const hndlr = route.handle[0].routes[0].handle[0].handler;

                        const { upstreams } = route.handle[0].routes[0].handle[0];
                        const { body } = route.handle[0].routes[0].handle[0];

                        const srvce = (body) ? '' : ` to upstream ${upstreams[0].dial}`;

                        console.info(`#${ndx + 1} - ${host} via ${hndlr}${srvce}`);
                    }
                }
            }
        }
    } else {
        console.info('>>>>>>>>>>>>>>>>>>> default static responder not up!');
    }
};

exports.skipContainer = (containerId, evtInfo) => {
    if (evtInfo) {
        const isEventSrc = containerId === evtInfo.actorId;
        if (isEventSrc && evtInfo.isContainerDying) {
            return true;
        }
    } else {
        return true;
    }

    return false;
};

exports.getRvsCfg = (lbls) => {
    // const doAutoHttps = dockerUtils.getLabelBoolVal(lbls, 'virtual.autohttps');
    // const doWsocketPassThru = dockerUtils.getLabelBoolVal(lbls, 'virtual.websockets');

    const domainMatch = {
        host: [`${lbls['virtual.host']}`],
    };

    const svrName = lbls['virtual.server'];
    const svrPort = lbls['virtual.port'];
    const domainHndlr = {
        handler: 'reverse_proxy',
        upstreams: [{ dial: `${svrName}:${svrPort}` }],
    };

    const handler = {
        handler: 'subroute',
        routes: [{ handle: [domainHndlr] }],
    };

    return { match: [domainMatch], handle: [handler] };
};

exports.getStaticRoute = (HOST_IP) => {
    const staticMatch = {
        host: [`${HOST_IP}`],
    };

    const staticHandler = {
        handler: 'static_response',
        body: '<!DOCTYPE html>'
            + '<html lang="en">'
            + '<head>'
            + '    <meta charset="UTF-8">'
            + '    <title>Caddy default static server</title>'
            + '</head>'
            + '<body>'
            + '    Hello from Caddy v2 default static responder'
            + '</body>'
            + '</html>',
    };

    const handler = {
        handler: 'subroute',
        routes: [{ handle: [staticHandler] }],
    };

    return [{ match: [staticMatch], handle: [handler] }];
};

exports.isMinimumLabelsFound = (labelsRay, REQUIRED) => {
    for (const label of REQUIRED) {
        if (!(label in labelsRay)) {
            return false;
        }
    }

    return true;
};
