/*
 * moleculer-iam
 * Copyright (c) 2019 QMIT Inc. (https://github.com/qmit-pro/moleculer-iam)
 * MIT Licensed
 */

import { Errors, ServiceSchema } from "moleculer";
import { IdentityProvider, IdentityProviderOptions, IdentityClaimsSchemaPayload } from "../identity";
import { OIDCProvider, OIDCProviderOptions, OIDCModelNames } from "../oidc";
import { IAMServer, IAMServerOptions } from "../server";
import { IAMServiceActionParams } from "./params";

export type IAMServiceSchemaOptions = {
  idp: IdentityProviderOptions,
  oidc: OIDCProviderOptions,
  server: IAMServerOptions,
};

export function IAMServiceSchema(opts: IAMServiceSchemaOptions): ServiceSchema {
  let idp: IdentityProvider;
  let oidc: OIDCProvider;
  let server: IAMServer;

  return {
    created() {
      // create identity provider
      idp = this.idp = new IdentityProvider({
        logger: this.broker.getLogger("idp"),
      }, opts.idp);

      // create oidc provider
      oidc = this.oidc = new OIDCProvider({
        idp,
        logger: this.broker.getLogger("oidc"),
      }, opts.oidc);

      // create server
      server = this.server = new IAMServer({
        oidc,
        logger: this.broker.getLogger("server"),
      }, opts.server);
    },
    async started() {
      await server.start();
    },
    async stopped() {
      await server.stop();
    },

    name: "iam",
    settings: {},

    hooks: {
      // transform OIDC provider error
      error: {
        "*"(ctx: any, err: any) {
          if (err.status === 422) {
            throw new Errors.ValidationError(err.error_description!, null as any, err.fields);
          } else if (err.status <= 400 && err.status < 500) {
            throw new Errors.MoleculerClientError(err.error_description!, err.statusCode, err.error);
          } else if (err.status >= 500) {
            throw new Errors.MoleculerServerError(err.error_description!, err.statusCode, err.error);
          }
          throw err;
        },
      },
    },

    actions: {
      /* Client Management */
      "client.create": {
        description: `
          Create OIDC Client. All params from below reference will be accepted.
          ref: https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
        `,
        params: IAMServiceActionParams["client.create"],
        async handler(ctx) {
          // const client = await oidc.createClient(ctx.params as any);
          // this.broker.broadcast("iam.client.updated");
          // return client;
        },
      },
      "client.update": {
        params: IAMServiceActionParams["client.update"],
        async handler(ctx) {
          // const client = await oidc.updateClient(ctx.params as any);
          // this.broker.broadcast("iam.client.updated");
          // return client;
        },
      },
      "client.delete": {
        params: {
          id: "string",
        },
        async handler(ctx) {
          // await oidc.deleteClient((ctx.params as any).id);
          this.broker.broadcast("iam.client.deleted", ctx.params); // 'oidc-provider' has a hard coded LRU cache internally... using pub/sub to clear distributed nodes' cache
          return true;
        },
      },
      "client.find": {
        cache: {
          ttl: 3600,
        },
        params: {
          id: "string",
        },
        async handler(ctx) {
          // return oidc.findClient((ctx.params as any).id);
        },
      },
      "client.get": {
        cache: {
          ttl: 3600,
        },
        params: {
          where: {
            type: "any",
            optional: true,
          },
          offset: {
            type: "number",
            positive: true,
            default: 0,
          },
          limit: {
            type: "number",
            positive: true,
            default: 10,
          },
        },
        async handler(ctx) {
          const {offset, limit, where} = ctx.params! as any;
          const [total, entries] = await Promise.all([
            // oidc.countClients(where),
            // oidc.getClients(ctx.params),
          ]);
          return {offset, limit, total, entries};
        },
      },
      "client.count": {
        cache: {
          ttl: 3600,
        },
        params: {
          where: {
            type: "any",
            optional: true,
          },
        },
        async handler(ctx) {
          // return oidc.countClients(ctx.params && (ctx.params as any).where);
        },
      },

      /* "Session", "AccessToken", "AuthorizationCode", "RefreshToken", "DeviceCode", "InitialAccessToken", "RegistrationAccessToken", "Interaction", "ReplayDetection", "PushedAuthorizationRequest" Management */
      "model.get": {
        cache: {
          ttl: 30,
        },
        params: {
          kind: {
            type: "enum",
            values: OIDCModelNames,
          },
          where: {
            type: "any",
            optional: true,
          },
          offset: {
            type: "number",
            positive: true,
            default: 0,
          },
          limit: {
            type: "number",
            positive: true,
            default: 10,
          },
        },
        async handler(ctx) {
          const {offset, limit, kind, where, ...args} = ctx.params! as any;
          const [total, entries] = await Promise.all([
            // oidc.countModels(kind, where),
            // oidc.getModels(kind, {offset, limit, where, ...args}),
          ]);
          return {offset, limit, total, entries};
        },
      },
      "model.count": {
        cache: {
          ttl: 30,
        },
        params: {
          kind: {
            type: "enum",
            values: OIDCModelNames,
          },
          where: {
            type: "any",
            optional: true,
          },
        },
        async handler(ctx) {
          const {kind, where} = ctx.params! as any;
          return oidc.countModels(kind, where);
        },
      },
      "model.delete": {
        params: {
          kind: {
            type: "enum",
            values: OIDCModelNames,
          },
          where: {
            type: "any",
            optional: false,
          },
          offset: {
            type: "number",
            positive: true,
            default: 0,
          },
          limit: {
            type: "number",
            positive: true,
            default: 10,
          },
        },
        async handler(ctx) {
          const {kind, ...args} = ctx.params! as any;
          return oidc.deleteModels(kind, args);
        },
      },

      /* Identity Claims Schema Management */
      "schema.get": {
        params: {
          scope: [
            {
              type: "array",
              items: {
                type: "string",
                trim: true,
                empty: false,
              },
              default: [],
              optional: true,
            },
            {
              type: "string",
              default: "",
              optional: true,
            },
          ],
          key: {
            type: "string",
            empty: false,
            trim: true,
            optional: true,
          },
          version: {
            type: "string",
            empty: false,
            trim: true,
            optional: true,
          },
          active: {
            type: "boolean",
            optional: true,
          },
        },
        async handler(ctx) {
          return idp.claims.getClaimsSchemata(ctx.params as any);
        },
      },
      "schema.find": {
        params: {
          key: {
            type: "string",
            empty: false,
            trim: true,
          },
          version: {
            type: "string",
            empty: false,
            trim: true,
            optional: true,
          },
          active: {
            type: "boolean",
            optional: true,
          },
        },
        async handler(ctx) {
          return idp.claims.getClaimsSchema(ctx.params as any);
        },
      },
      "schema.define": {
        params: IAMServiceActionParams["schema.define"],
        async handler(ctx) {
          const payload = ctx.params as IdentityClaimsSchemaPayload;
          const oldSchema = await idp.claims.getClaimsSchema({key: payload.key, active: true});
          const schema = await idp.claims.defineClaimsSchema(payload);
          if (!oldSchema || oldSchema.version !== schema.version) {
            this.broker.broadcast("iam.schema.updated");
          }
          return schema;
        },
      },

      /* Identity Management */
      "id.validate": {
        params: {
          id: {
            type: "string",
            optional: true,
          },
          scope: [
            {
              type: "array",
              items: {
                type: "string",
                trim: true,
                empty: false,
              },
              default: [],
              optional: true,
            },
            {
              type: "string",
              default: "",
              optional: true,
            },
          ],
          claims: {
            type: "object",
            default: {},
          },
          credentials: {
            type: "object",
            default: {},
          },
        },
        async handler(ctx) {
          await idp.validate(ctx.params as any);
          return ctx.params;
        },
      },
      "id.validateCredentials": {
        params: {
          password: {
            type: "string",
            optional: true,
          },
        },
        async handler(ctx) {
          await idp.validateCredentials(ctx.params as any);
          return ctx.params;
        },
      },
      "id.create": {
        params: {
          scope: [
            {
              type: "array",
              items: {
                type: "string",
                trim: true,
                empty: false,
              },
              default: [],
              optional: true,
            },
            {
              type: "string",
              default: "",
              optional: true,
            },
          ],
          metadata: {
            type: "object",
            default: {},
          },
          claims: {
            type: "object",
            default: {},
          },
          credentials: {
            type: "object",
            default: {},
          },
        },
        async handler(ctx) {
          const id = await idp.create(ctx.params as any)
            .then(i => i.json());
          this.broker.broadcast("iam.id.updated");
          return id;
        },
      },
      "id.update": {
        params: {
          id: [
            // support batching
            {
              type: "string",
              optional: true,
            },
            {
              type: "array",
              items: "string",
              optional: true,
            },
          ],
          scope: [
            {
              type: "array",
              items: {
                type: "string",
                trim: true,
                empty: false,
              },
              default: [],
              optional: true,
            },
            {
              type: "string",
              default: "",
              optional: true,
            },
          ],
          claims: {
            type: "object",
            default: {},
          },
          metadata: {
            type: "object",
            default: {},
          },
          credentials: {
            type: "object",
            default: {},
          },
        },
        async handler(ctx) {
          const {id, claims, metadata, credentials, scope} = (ctx.params || {}) as any;
          let result: any;

          // batching
          if (Array.isArray(id)) {
            result = await idp.get({where: {id}, limit: id.length})
              .then(ids =>
                Promise.all(
                  ids.map(i => i.update(scope, claims, metadata, credentials)
                    .then(
                      () => i.json(scope),
                      (err: any) => {
                        err.batchingError = true;
                        return err;
                      },
                    ),
                  ),
                ),
              );
          } else {
            result = await idp.findOrFail({id})
              .then(i => i.update(scope, claims, metadata, credentials).then(() => i.json(scope)));
          }

          this.broker.broadcast("iam.id.updated");
          return result;
        },
      },
      "id.delete": {
        params: {
          id: [
            // support batching
            {
              type: "string",
              optional: true,
            },
            {
              type: "array",
              items: "string",
              optional: true,
            },
          ],
          permanently: {
            type: "boolean",
            default: false,
          },
        },
        async handler(ctx) {
          const {id, permanently} = (ctx.params || {}) as any;
          const where: any = {id, metadata: { softDeleted: permanently }};

          // batching support
          if (Array.isArray(id)) {
            return idp.get({where, limit: id.length})
              .then(ids =>
                Promise.all(
                  ids.map(i => i.delete(permanently)
                    .then(() => i.id, (err: any) => {
                      err.batchingError = true;
                      return err;
                    }),
                  ),
                ),
              );
          }

          return idp.findOrFail(where).then(i => i.delete(permanently)).then(() => id);
        },
      },
      "id.restore": {
        params: {
          id: [
            // support batching
            {
              type: "string",
              optional: true,
            },
            {
              type: "array",
              items: "string",
              optional: true,
            },
          ],
        },
        async handler(ctx) {
          const {id} = (ctx.params || {}) as any;
          const where: any = {id, metadata: { softDeleted: true }};

          // batching support
          if (Array.isArray(id)) {
            return idp.get({where, limit: id.length})
              .then(ids =>
                Promise.all(
                  ids.map(i => i.restoreSoftDeleted()
                    .then(() => i.id, (err: any) => {
                      err.batchingError = true;
                      return err;
                    }),
                  ),
                ),
              );
          }

          return idp.findOrFail(where).then(i => i.restoreSoftDeleted()).then(() => id);
        },
      },
      "id.find": {
        cache: {
          ttl: 3600,
        },
        params: {
          id: [
            // support batching
            {
              type: "string",
              optional: true,
            },
            {
              type: "array",
              items: "string",
              optional: true,
            },
          ],
          email: {
            type: "string",
            optional: true,
          },
          phone_number: {
            type: "string",
            optional: true,
          },
          where: {
            type: "any",
            optional: true,
          },
          scope: [
            {
              type: "array",
              items: {
                type: "string",
                trim: true,
                empty: false,
              },
              default: [],
              optional: true,
            },
            {
              type: "string",
              default: "",
              optional: true,
            },
          ],
        },
        async handler(ctx) {
          // tslint:disable-next-line:prefer-const
          let {id, email, phone_number, where, scope} = (ctx.params || {}) as any;
          if (typeof where !== "object" || where === null) where = {};

          // batching support
          if (Array.isArray(id)) {
            return idp.get({where: {id}, limit: id.length})
              .then(ids =>
                Promise.all(
                  ids.map(i => i.json(scope)
                    .then(undefined, (err: any) => {
                      err.batchingError = true;
                      return err;
                    }),
                  ),
                ),
              );
          }

          if (id) where.id = id;
          if (email) {
            if (!where.claims) where.claims = {};
            where.claims.email = email;
          }
          if (phone_number) {
            if (!where.claims) where.claims = {};
            where.claims.phone_number = phone_number;
          }
          if (Object.keys(where).length === 0) where.id = null;

          return idp.find(where).then(async i => i ? await i.json(scope) : null);
        },
      },
      "id.get": {
        cache: {
          ttl: 3600,
        },
        params: {
          where: {
            type: "any",
            optional: true,
          },
          offset: {
            type: "number",
            positive: true,
            default: 0,
          },
          limit: {
            type: "number",
            positive: true,
            default: 10,
          },
          scope: [
            {
              type: "array",
              items: {
                type: "string",
                trim: true,
                empty: false,
              },
              default: [],
              optional: true,
            },
            {
              type: "string",
              default: "",
              optional: true,
            },
          ],
        },
        async handler(ctx) {
          const {offset, limit, kind, where, scope, ...args} = (ctx.params || {}) as any;
          const [total, entries] = await Promise.all([
            idp.count(where),
            idp.get({offset, limit, where, ...args}).then(ids => Promise.all(ids.map(i => i.json(scope)))),
          ]);
          return {offset, limit, total, entries};
        },
      },
      "id.count": {
        cache: {
          ttl: 3600,
        },
        params: {
          where: {
            type: "any",
            optional: true,
          },
        },
        async handler(ctx) {
          return idp.count(ctx.params && (ctx.params as any).where);
        },
      },
      "id.refresh": {
        cache: {
          ttl: 5, // to give a delay
        },
        params: {
          id: [
            {
              type: "string",
              optional: true,
            },
            {
              type: "array",
              items: "string",
              optional: true,
            },
          ],
          where: {
            type: "any",
            optional: true,
          },
        },
        async handler(ctx) {
          const { where, id } = ctx.params as any;
          let ids: string[] | undefined;
          if (typeof id === "string") ids = [id];
          else if (Array.isArray(id)) ids = id;

          await idp.claims.forceReloadClaims({where, ids});
          this.broker.broadcast("iam.id.updated");
        },
      },
    },

    events: {
      "iam.client.deleted": {
        // @ts-ignore
        params: {
          id: "string",
        },
        async handler(ctx: any) {
          try {
            // to clear internal memory cache
            // await oidc.deleteClient(ctx.params.id);
          } catch (err) {
            // ...NOTHING
          } finally {
            await this.clearCache("client.**");
          }
        },
      },
      "iam.client.updated": {
        async handler(ctx: any) {
          await this.clearCache("client.**");
        },
      },
      "iam.id.updated": {
        async handler(ctx: any) {
          await this.clearCache("id.*");
        },
      },
      "iam.schema.updated": {
        async handler(ctx: any) {
          await idp.claims.onClaimsSchemaUpdated();
          await oidc.syncSupportedClaimsAndScopes();
          await this.clearCache("schema.*");
          await this.clearCache("id.*");
        },
      },
    },

    methods: {
      async clearCache(...keys: string[]) {
        if (this.broker.cacher) {
          if (keys.length === 0) {
            keys = ["**"];
          }
          const fullKeys = keys.map(key => `${this.fullName}.${key}`);
          await this.broker.cacher.clean(fullKeys);
        }
      },
    },
  };
}
