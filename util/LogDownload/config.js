
const hostConfig = {
    ready: {
        summaryHost: 'http://ready-logs.wkcoding.com',
        downloadHost: 'http://47.103.29.74',
    },
    release: {
        summaryHost: 'http://logs.wkcoding.com',
        downloadHost: 'http://47.103.29.74',
    }
}

const pathConfig = {
    ready: {
        summaryPath: '/summary',
        clientLogPath: '/testclientlogs/',
        nativeLogPath: '/testNativeLogs/',
    },
    release: {
        summaryPath: '/summary',
        clientLogPath: '/clientlogs/',
        nativeLogPath: '/native_logs/',
    }
}

function getConfigUrl(tEnvironment, tHost, tPath) {
    if (!hostConfig[tEnvironment] || !pathConfig[tEnvironment]) return '';
    return hostConfig[tEnvironment][tHost] + pathConfig[tEnvironment][tPath];
}