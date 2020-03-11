"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const moleculer_1 = require("moleculer");
const moleculer_qmit_1 = require("moleculer-qmit");
const __1 = require("../../");
const config_1 = require("./config");
const app_1 = require("./app");
exports.isDebug = config_1.config.isDebug, exports.isDev = config_1.config.isDev;
// create service broker
exports.broker = new moleculer_1.ServiceBroker(moleculer_qmit_1.createBrokerOptions({
    logLevel: exports.isDebug ? "debug" : "info",
}));
// create IAM service
exports.broker.createService(__1.IAMServiceSchema(_.defaultsDeep({
    idp: {
        claims: {
            mandatoryScopes: [
                "openid",
                "profile",
                "email",
                // "phone",
                "impersonation",
            ],
        },
    },
    op: {
        dev: exports.isDev,
        issuer: exports.isDev ? "https://account.dev.qmit.pro" : "https://account.qmit.pro",
        discovery: {
            op_policy_uri: exports.isDev ? "https://account.dev.qmit.pro/help/policy" : "https://account.qmit.pro/help/policy",
            op_tos_uri: exports.isDev ? "https://account.dev.qmit.pro/help/tos" : "https://account.qmit.pro/help/tos",
            service_documentation: exports.isDev ? "https://account.dev.qmit.pro/help" : "https://account.qmit.pro/help",
        },
        app: {
            renderer: {
                options: {
                    register: {
                        skipEmailVerification: true,
                        skipPhoneVerification: true,
                    },
                },
            },
            verifyEmail: {
                async send({ logger, ...args }) {
                    logger.info(args);
                },
            },
            verifyPhone: {
                async send({ logger, ...args }) {
                    logger.info(args);
                },
            },
        },
    },
    server: {
        app: app_1.app,
        http: {
            hostname: "0.0.0.0",
            port: 9090,
        },
    },
}, config_1.config.iam)));
//# sourceMappingURL=iam.js.map