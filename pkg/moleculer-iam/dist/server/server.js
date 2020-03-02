"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http = tslib_1.__importStar(require("http"));
const http2 = tslib_1.__importStar(require("http2"));
const https = tslib_1.__importStar(require("https"));
const kleur = tslib_1.__importStar(require("kleur"));
const koa_1 = tslib_1.__importDefault(require("koa"));
const koa_helmet_1 = tslib_1.__importDefault(require("koa-helmet"));
const koa_json_1 = tslib_1.__importDefault(require("koa-json"));
const koa_mount_1 = tslib_1.__importDefault(require("koa-mount"));
// @ts-ignore
const koa_locale_1 = tslib_1.__importDefault(require("koa-locale"));
const logging_1 = require("./logging");
const koa_compose_1 = tslib_1.__importDefault(require("koa-compose"));
class IAMServer {
    constructor(props, opts) {
        this.props = props;
        this.working = false;
        const options = this.options = opts || {};
        const { logger, op } = props;
        this.logger = logger || console;
        // create web server application
        const app = this.app = new koa_1.default();
        app.env = op.app.env = "production";
        app.proxy = op.app.proxy = true;
        // apply web security and logging middleware
        app.use(logging_1.logging(this.logger, options.logging));
        app.use(koa_helmet_1.default(options.security));
        app.use(koa_json_1.default({
            pretty: true,
            spaces: 2,
        }));
        // set locale into context
        koa_locale_1.default(app, "locale");
        app.use((ctx, next) => {
            // parsed by precedence of ?locale=ko-KR, Cookie: locale=ko-KR, Accept-Language: ko-KR
            // ref: https://github.com/koa-modules/locale
            // @ts-ignore
            const request = ctx.getLocaleFromQuery() || ctx.getLocaleFromCookie() || ctx.getLocaleFromHeader();
            const result = op.parseLocale(request);
            ctx.locale = result;
            return next();
        });
    }
    async start() {
        if (this.working) {
            return;
        }
        // start op
        const { op } = this.props;
        await op.start();
        // mount optional app routes and oidc provider routes
        const opRoutes = koa_mount_1.default(op.app);
        if (this.options.app) {
            const appRoutes = await this.options.app(op);
            this.app.use(koa_compose_1.default([appRoutes, opRoutes]));
        }
        else {
            this.app.use(opRoutes);
        }
        // start servers
        const config = this.options;
        const handler = this.app.callback();
        if (config.http2s) {
            const { hostname, port = 443, ...opts } = config.http2s;
            this.http2s = http2.createSecureServer(opts, handler);
            this.http2s.listen(port, hostname, undefined, this.listenCallback("http2", "https", hostname, port));
        }
        if (config.http2) {
            const { hostname, port = 8080, ...opts } = config.http2;
            this.http2 = http2.createServer(opts, handler);
            this.http2.listen(port, hostname, undefined, this.listenCallback("http2", "http", hostname, port));
        }
        if (config.https) {
            const { hostname, port = 443, ...opts } = config.https;
            this.https = https.createServer(opts, handler);
            this.https.listen(port, hostname, undefined, this.listenCallback("https", "https", hostname, port));
        }
        if (config.http || !this.https && !this.http2 && !this.http2s) {
            const { hostname, port = 8080, ...opts } = config.http || { hostname: "localhost" };
            this.http = http.createServer(opts, handler);
            this.http.listen(port, hostname, undefined, this.listenCallback("http", "http", hostname, port));
        }
        this.working = true;
        this.logger.info(`IAM server has been started`);
    }
    listenCallback(protocol, scheme, hostname, port) {
        const { op } = this.props;
        const discoveryURL = kleur.blue(`${scheme}://${hostname}:${port}/.well-known/openid-configuration`);
        const issuerURL = kleur.yellow(op.issuer);
        return () => {
            this.logger.info(`${kleur.blue(protocol.toUpperCase() + " server")} is listening:\n* OIDC discovery endpoint: ${discoveryURL}\n* OIDC issuer: ${issuerURL}`);
        };
    }
    async stop() {
        if (!this.working) {
            return;
        }
        if (this.http) {
            this.http.close(() => this.logger.info(`http server has been stopped`));
        }
        if (this.https) {
            this.https.close(() => this.logger.info(`https server has been stopped`));
        }
        if (this.http2) {
            this.http2.close(() => this.logger.info(`http2 server has been stopped`));
        }
        if (this.http2s) {
            this.http2s.close(() => this.logger.info(`http2s server has been stopped`));
        }
        // stop op
        await this.props.op.stop();
        this.working = false;
        this.logger.info(`IAM server has been stopped`);
    }
}
exports.IAMServer = IAMServer;
//# sourceMappingURL=server.js.map