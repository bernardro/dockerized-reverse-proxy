const { CADDY_ADMIN_PORT } = process.env;

exports.CADDY_ADMIN = {
    HOST: 'caddysvr',
    ORIGIN: 'genconfig',
    PORT: parseInt(CADDY_ADMIN_PORT, 10),
    TIMEOUT_MS: 3000,
};

exports.LABELS = {
    REQUIRED: ['virtual.server', 'virtual.port'],
    OPTIONAL: ['virtual.tls-email', 'virtual.websockets'],
};

exports.SVR_NAMES = {
    DEFAULT_STATIC: 'default',
};

exports.CONTAINER = {
    GOING_DOWN: ['pause', 'oom', 'die'],
    GOING_UP: ['start', 'unpause'],
};
