const Docker = require('dockerode');
const fs = require('fs');

const caddyUtils = require('./utils_caddy');
const dockerUtils = require('./utils_docker');
const CONSTS = require('./consts');

const { DOCKER_SOCKET, NETWORK_NAME, CADDY_TRANSFER_PORT: transPORT, VERBOSE_DEBUG } = process.env;
const showDbgLogs = VERBOSE_DEBUG === 'true';

const stats = fs.statSync(DOCKER_SOCKET);
if (!stats.isSocket()) {
    throw new Error('Are you sure the docker is running?');
}

const docker = new Docker({ socketPath: DOCKER_SOCKET });

const updateConfigsFromContainers = (evtInfo) => {
    docker.listContainers({ all: true }, (err, cntnrs) => {
        if (err) {
            throw new Error(`>> err listing containers ${err}`);
        }

        const prxyCntnrs = cntnrs.filter(cont => dockerUtils.isAttachedToPrxyNet(cont, NETWORK_NAME));
        const caddyServers = caddyUtils.getNewCfgSvrsScope(prxyCntnrs, transPORT, CONSTS, evtInfo);

        caddyUtils.updateCaddyCfg(caddyServers, showDbgLogs, CONSTS.CADDY_ADMIN);
    });
};

// generate an initial config
updateConfigsFromContainers(null);

const evtHandler = (err, stream) => {
    if (err) {
        throw new Error(`error while handling event [${err}]`);
    }

    stream.on('data', (dta) => {
        const evtJson = JSON.parse(dta.toString());

        const objEvt = evtJson.Action;
        if (showDbgLogs) {
            console.info(`\n>>> Config update triggered by [${objEvt}] event of '${evtJson.from}' (a docker ${evtJson.Type})`);
        }

        const actorId = evtJson.Actor.ID;
        const isContainerDying = CONSTS.CONTAINER.GOING_DOWN.indexOf(objEvt) >= 0;

        const evtInfo = { actorId, isContainerDying };
        updateConfigsFromContainers(evtInfo);
    });
};

// listen for triggers to update config
docker.getEvents({
    filters: {
        type: ['container'],
        event: ['update', ...CONSTS.CONTAINER.GOING_UP, ...CONSTS.CONTAINER.GOING_DOWN],
    },
}, evtHandler);
