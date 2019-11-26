"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const base_1 = require("../base");
exports.OIDCModelNames = base_1.OIDCModelNames;
exports.OIDCGrantModelNames = base_1.OIDCGrantModelNames;
class OIDCModel {
    /**
     *
     * Creates an instance of MyAdapter for an oidc-provider model.
     *
     * @constructor
     * @param props
     *
     * @param props.name "AuthorizationCode", "RefreshToken", "ClientCredentials", "Client", "InitialAccessToken",
     * "RegistrationAccessToken", "DeviceCode", "Interaction", "ReplayDetection", or "PushedAuthorizationRequest"
     * @param props.logger
     * @param options
     */
    constructor(props, options) {
        this.props = props;
        this.logger = console;
        if (props.logger) {
            this.logger = props.logger;
        }
        this.logger.info(`${kleur.cyan(this.name)} OIDC model adapter has been created`);
    }
    get name() {
        return this.props.name;
    }
}
exports.OIDCModel = OIDCModel;
//# sourceMappingURL=model.js.map