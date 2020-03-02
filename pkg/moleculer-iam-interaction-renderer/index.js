"use strict";
/*
  should be recompiled (yarn workspace moleculer-iam-interaction-renderer build-server) on updates
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var path_1 = __importDefault(require("path"));
// @ts-ignore
var fs_1 = __importDefault(require("fs"));
// @ts-ignore
var koa_static_cache_1 = __importDefault(require("koa-static-cache"));
var config_1 = __importDefault(require("./config"));
var output = config_1.default.output;
var DefaultInteractionRenderer = /** @class */ (function () {
    function DefaultInteractionRenderer(options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.options = options;
        this.render = function (ctx, state, props) { return __awaiter(_this, void 0, void 0, function () {
            var serializedState, _a, header, footer;
            return __generator(this, function (_b) {
                // reload views for each rendering for development mode
                if (props.dev) {
                    try {
                        this.loadViews(props.prefix);
                    }
                    catch (error) {
                        props.logger.error("failed to reload views", error);
                    }
                }
                try {
                    serializedState = JSON.stringify(state);
                }
                catch (error) {
                    props.logger.error("failed to stringify server state", state, error);
                    serializedState = JSON.stringify({ error: { error: error.name, error_description: error.message } });
                }
                _a = this.views, header = _a.header, footer = _a.footer;
                ctx.body = header + "<script>window.__SERVER_STATE__=" + serializedState + ";</script>" + footer;
                return [2 /*return*/];
            });
        }); };
        this.routes = function (props) {
            return [
                koa_static_cache_1.default(output.path, {
                    prefix: output.publicPath,
                    maxAge: props.dev ? 0 : 60 * 60 * 24 * 7,
                    dynamic: props.dev,
                    preload: !props.dev,
                }),
            ];
        };
    }
    DefaultInteractionRenderer.prototype.loadViews = function (prefix) {
        var html = fs_1.default.readFileSync(path_1.default.join(output.path, "index.html")).toString();
        var index = html.indexOf("<script");
        // inject server-side options, ref ./inject.ts
        this.options.prefix = prefix;
        var options = "<script>window.__SERVER_OPTIONS__=" + JSON.stringify(this.options) + ";</script>";
        this.views = {
            header: html.substring(0, index),
            footer: options + html.substring(index),
        };
    };
    return DefaultInteractionRenderer;
}());
exports.default = DefaultInteractionRenderer;
