const request = require('request');
const dockerUtils = require('./utils_docker');


exports.updateCaddyCfg = (serversCnfg, showDbgLogs, caddyAdmin) => {
    const opts = {
        baseUrl: `http://${caddyAdmin.HOST}:${caddyAdmin.PORT}`,
        url: '/config/apps/http/servers',
        body: serversCnfg,
        json: true,
        followRedirect: false,
        timeout: caddyAdmin.TIMEOUT_MS,
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

exports.getNewCfgSvrsScope = (containers, transPORT, CONSTS, evtInfo) => {
    let svrConfigs = {};

    for (const container of containers) {
        // check if event is about to bring this container down
        if (exports.skipContainer(container.Id, evtInfo)) {
            // if container going down leave it out of the new config
            break;
        }

        const labels = container.Labels;
        const reqLabelsFound = exports.isMinimumLabelsFound(labels, CONSTS.LABELS.REQUIRED);
        if (reqLabelsFound) {
            const rvsConfig = exports.getRvsCfg(labels, transPORT);

            // append to new caddy config
            svrConfigs = { ...svrConfigs, ...rvsConfig };
        }
    }

    // check if any reverse proxy servers were configured
    if (Object.keys(svrConfigs).length === 0) {
        // if no reverse proxy servers configured
        // set up the default static server
        svrConfigs = exports.getStaticCfg(transPORT, CONSTS);
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
                console.info(`[${kee}] listening on ${svrCfg.listen[0]} with handler`);
                console.dir(JSON.stringify(svrCfg.routes[0].handle, '', 2));
                console.info('\n');
            }
        }
    } else {
        console.info('no servers updated');
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

exports.getRvsCfg = (lbls, caddyPort) => {
    const doAutoHttps = dockerUtils.getLabelBoolVal(lbls, 'virtual.autohttps');
    // const doWsocketPassThru = dockerUtils.getLabelBoolVal(lbls, 'virtual.websockets');

    const svrName = lbls['virtual.server'];
    const svrPort = lbls['virtual.port'];
    const handler = {
        handler: 'reverse_proxy',
        upstreams: [{ dial: `${svrName}:${svrPort}` }],
    };

    const svrCfg = {};
    svrCfg[svrName] = {
        listen: [`:${caddyPort}`],
        routes: [{ handle: [handler] }],
        automatic_https: { disable: !doAutoHttps },
    };

    return svrCfg;
};

exports.getStaticCfg = (caddyPort, CONSTS) => {
    const staticHandler = {
        handler: 'static_response',
        body: '<!DOCTYPE html>'
            + '<html lang="en">'
            + '<head>'
            + '    <meta charset="UTF-8">'
            + '    <title>Caddy default static server</title>'
            + '</head>'
            + '<body>'
            + '    Hello from Caddy v2 default static server'
            + '</body>'
            + '</html>',
    };

    const staticCfg = {};
    staticCfg[CONSTS.SVR_NAMES.DEFAULT_STATIC] = {
        listen: [`:${caddyPort}`],
        routes: [{ handle: [staticHandler] }],
        automatic_https: { disable: true },
    };

    return staticCfg;
};

exports.isMinimumLabelsFound = (labelsRay, REQUIRED) => {
    for (const label of REQUIRED) {
        if (!(label in labelsRay)) {
            return false;
        }
    }

    return true;
};
