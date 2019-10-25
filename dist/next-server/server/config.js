"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const find_up_1 = __importDefault(require("find-up"));
const os_1 = __importDefault(require("os"));
const constants_1 = require("../lib/constants");
const utils_1 = require("../lib/utils");
const targets = ['server', 'serverless', 'experimental-serverless-trace'];
const defaultConfig = {
    env: [],
    webpack: null,
    webpackDevMiddleware: null,
    distDir: '.next',
    assetPrefix: '',
    configOrigin: 'default',
    useFileSystemPublicRoutes: true,
    generateBuildId: () => null,
    generateEtags: true,
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    target: 'server',
    poweredByHeader: true,
    compress: true,
    devIndicators: {
        buildActivity: true,
        autoPrerender: true,
    },
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 2,
    },
    amp: {
        canonicalBase: '',
    },
    exportTrailingSlash: false,
    experimental: {
        ampBindInitData: false,
        cpus: Math.max(1, (Number(process.env.CIRCLE_NODE_TOTAL) ||
            (os_1.default.cpus() || { length: 1 }).length) - 1),
        css: false,
        documentMiddleware: false,
        granularChunks: false,
        modern: false,
        profiling: false,
        publicDirectory: false,
        sprFlushToDisk: true,
    },
    future: {
        excludeDefaultMomentLocales: false,
    },
    serverRuntimeConfig: {},
    publicRuntimeConfig: {},
};
const experimentalWarning = utils_1.execOnce(() => {
    console.warn(chalk_1.default.yellow.bold('Warning: ') +
        chalk_1.default.bold('You have enabled experimental feature(s).'));
    console.warn(`Experimental features are not covered by semver, and may cause unexpected or broken application behavior. ` +
        `Use them at your own risk.`);
    console.warn();
});
function assignDefaults(userConfig) {
    Object.keys(userConfig).forEach((key) => {
        if (key === 'experimental' &&
            userConfig[key] &&
            userConfig[key] !== defaultConfig[key]) {
            experimentalWarning();
        }
        if (key === 'distDir' && userConfig[key] === 'public') {
            throw new Error(`The 'public' directory is reserved in Next.js and can not be set as the 'distDir'. https://err.sh/zeit/next.js/can-not-output-to-public`);
        }
        const maybeObject = userConfig[key];
        if (!!maybeObject && maybeObject.constructor === Object) {
            userConfig[key] = Object.assign({}, (defaultConfig[key] || {}), userConfig[key]);
        }
    });
    return Object.assign({}, defaultConfig, userConfig);
}
function normalizeConfig(phase, config) {
    if (typeof config === 'function') {
        config = config(phase, { defaultConfig });
        if (typeof config.then === 'function') {
            throw new Error('> Promise returned in next config. https://err.sh/zeit/next.js/promise-in-next-config');
        }
    }
    return config;
}
function loadConfig(phase, dir, customConfig) {
    if (customConfig) {
        return assignDefaults(Object.assign({ configOrigin: 'server' }, customConfig));
    }
    const path = find_up_1.default.sync(constants_1.CONFIG_FILE, {
        cwd: dir,
    });
    // If config file was found
    if (path && path.length) {
        const userConfigModule = require(path);
        const userConfig = normalizeConfig(phase, userConfigModule.default || userConfigModule);
        if (userConfig.target && !targets.includes(userConfig.target)) {
            throw new Error(`Specified target is invalid. Provided: "${userConfig.target}" should be one of ${targets.join(', ')}`);
        }
        if (userConfig.amp && userConfig.amp.canonicalBase) {
            const { canonicalBase } = userConfig.amp || {};
            userConfig.amp = userConfig.amp || {};
            userConfig.amp.canonicalBase =
                (canonicalBase.endsWith('/')
                    ? canonicalBase.slice(0, -1)
                    : canonicalBase) || '';
        }
        if (userConfig.target &&
            userConfig.target !== 'server' &&
            ((userConfig.publicRuntimeConfig &&
                Object.keys(userConfig.publicRuntimeConfig).length !== 0) ||
                (userConfig.serverRuntimeConfig &&
                    Object.keys(userConfig.serverRuntimeConfig).length !== 0))) {
            // TODO: change error message tone to "Only compatible with [fat] server mode"
            throw new Error('Cannot use publicRuntimeConfig or serverRuntimeConfig with target=serverless https://err.sh/zeit/next.js/serverless-publicRuntimeConfig');
        }
        return assignDefaults(Object.assign({ configOrigin: constants_1.CONFIG_FILE }, userConfig));
    }
    return defaultConfig;
}
exports.default = loadConfig;
function isTargetLikeServerless(target) {
    const isServerless = target === 'serverless';
    const isServerlessTrace = target === 'experimental-serverless-trace';
    return isServerless || isServerlessTrace;
}
exports.isTargetLikeServerless = isTargetLikeServerless;
