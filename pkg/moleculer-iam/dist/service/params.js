"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
const claims_1 = require("../idp/claims");
exports.IAMServiceActionParams = {};
// ref: "oidc-provider".AnyClientMetadata
// ref: https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
const clientCreateParams = exports.IAMServiceActionParams["client.create"] = {
    client_id: {
        type: "string",
        trim: true,
        empty: false,
    },
    client_name: {
        type: "string",
        trim: true,
        empty: false,
    },
    client_secret: {
        description: "will be auto-generated",
        type: "forbidden",
    },
    client_uri: {
        description: "Client homepage URL",
        type: "url",
        optional: true,
    },
    logo_uri: {
        description: "Client Logo Image URL",
        type: "url",
        optional: true,
    },
    policy_uri: {
        description: "Privacy Policy URL",
        type: "url",
        optional: true,
    },
    tos_uri: {
        description: "Terms of Service URL",
        type: "url",
        optional: true,
    },
    initiate_login_uri: {
        type: "url",
        optional: true,
    },
    contacts: {
        type: "array",
        items: "email",
        empty: true,
        default: [],
    },
    token_endpoint_auth_method: {
        type: "enum",
        values: ["client_secret_post", "client_secret_basic", "client_secret_jwt", "private_key_jwt", "none"],
        default: "none",
    },
    application_type: {
        type: "enum",
        values: ["web", "native"],
        default: "web",
    },
    redirect_uris: {
        type: "array",
        items: {
            type: "string",
            trim: true,
            empty: false,
        },
        empty: false,
    },
    post_logout_redirect_uris: {
        type: "array",
        items: {
            type: "string",
            trim: true,
            empty: false,
        },
        empty: true,
        default: [],
    },
    grant_types: {
        type: "array",
        items: "string",
        enum: [
            // will not support Resource Owner Password Credentials
            "authorization_code",
            "implicit",
            "refresh_token",
            "client_credentials",
            "urn:ietf:params:oauth:grant-type:device_code",
        ],
        default: ["implicit", "authorization_code", "refresh_token"],
    },
    response_types: {
        type: "array",
        items: "string",
        enum: [
            "code",
            "id_token", "id_token token",
            "code id_token", "code token", "code id_token token",
            "none",
        ],
        empty: false,
        default: [
            "code",
            "id_token", "id_token token",
            "code id_token", "code token", "code id_token token",
            "none",
        ],
    },
    subject_type: {
        type: "enum",
        values: ["public", "pairwise"],
        default: "public",
    },
    sector_identifier_uri: {
        type: "url",
        optional: true,
    },
    backchannel_logout_session_required: {
        type: "boolean",
        default: false,
    },
    backchannel_logout_uri: {
        type: "url",
        optional: true,
    },
    frontchannel_logout_session_required: {
        type: "boolean",
        default: false,
    },
    frontchannel_logout_uri: {
        type: "url",
        optional: true,
    },
    request_uris: {
        type: "array",
        items: "string",
        empty: true,
        default: [],
    },
    web_message_uris: {
        type: "array",
        items: "url",
        empty: true,
        default: [],
    },
    require_auth_time: {
        type: "boolean",
        default: true,
    },
    /* custom props */
    skip_consent: {
        type: "boolean",
        default: false,
    },
};
const clientUpdateParams = exports.IAMServiceActionParams["client.update"] = {};
for (const [param, schema] of Object.entries(clientCreateParams)) {
    const result = _.cloneDeep(schema);
    if (param !== "client_id") {
        delete result.default;
        result.optional = true;
    }
    if (param === "client_secret") {
        clientUpdateParams.reset_client_secret = {
            description: "client_secret will be updated if true",
            type: "boolean",
            optional: true,
            default: false,
        };
    }
    clientUpdateParams[param] = result;
}
exports.IAMServiceActionParams["schema.define"] = claims_1.IdentityClaimsSchemaPayloadValidationSchema;
//# sourceMappingURL=params.js.map