import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import noCache from "koajs-nocache";
import Validator, { ValidationSchema } from "fastest-validator";
import { IdentityProvider } from "../../identity";
import { Logger } from "../../logger";
import { KoaContextWithOIDC, Provider, interactionPolicy, Configuration, OIDCErrors } from "../provider";
import { ClientApplicationError, ClientApplicationRenderer } from "./render";
import { getPublicClientProps } from "./util";
// import { getPublicClientProps } from "./util";

// ref: https://github.com/panva/node-oidc-provider/blob/cd9bbfb653ddfb99c574ea3d4519b6f834274e86/docs/README.md#user-flows

export type InteractionFactoryProps = {
  idp: IdentityProvider;
  renderer: ClientApplicationRenderer;
  logger: Logger;
};

export class InteractionFactory {
  private readonly validator: Validator;
  private readonly router: Router<any, any>;

  constructor(protected readonly props: InteractionFactoryProps) {
    // create router
    this.router = new Router({
      prefix: "/interaction",
      sensitive: true,
      strict: false,
    });

    // apply router middleware
    this.router.use(
      noCache(),
      bodyParser(),
    );

    // create validator
    this.validator = new Validator();
  }

  // validate body with given schema then throw error on error
  private validate(ctx: KoaContextWithOIDC, schema: ValidationSchema) {
    const errors = this.validator.validate(ctx.request.body, schema);
    if (errors !== true && errors.length > 0) {
      const error: ClientApplicationError = {
        name: "validation_failed",
        message: "Failed to validate request params.",
        status: 422,
        detail: errors.reduce((fields, err) => {
          if (!fields[err.field]) fields[err.field] = [];
          const {field, message} = err;
          fields[field].push(message);
          return fields;
        }, {} as any),
        /*
          detail: {
            username: [{"type": "required", "message": "The 'username' field is required.",}],
            ...
          }
         */
      };

      throw error;
    }
  }

  /*
  * can add more user interactive features (prompts) into base policy which includes login, consent prompts
  * example ref (base): https://github.com/panva/node-oidc-provider/tree/master/lib/helpers/interaction_policy/prompts

  * example route mappings (original default)
  get('interaction', '/interaction/:uid', error(this), ...interaction.render);
  post('submit', '/interaction/:uid', error(this), ...interaction.submit);
  get('abort', '/interaction/:uid/abort', error(this), ...interaction.abort);

  * each route handlers
  https://github.com/panva/node-oidc-provider/blob/8fb8af509c652b13620534cc755cf5b9320f694f/lib/actions/interaction.js

  * related views
  https://github.com/panva/node-oidc-provider/blob/master/lib/views/layout.js
  */
  public interactions(): Configuration["interactions"] {
    const {Prompt, Check, base} = interactionPolicy;
    const defaultPrompts = base();
    return {
      async url(ctx, interaction) {
        return `/interaction/${interaction.prompt.name}`;
      },

      // ref: https://github.com/panva/node-oidc-provider/blob/cd9bbfb653ddfb99c574ea3d4519b6f834274e86/docs/README.md#user-flows
      // ... here goes more interactions
      policy: [
        defaultPrompts.get("login"),
        defaultPrompts.get("consent"),
      ],
    };
  }

  /* create interaction routes */
  public routes(provider: Provider) {

    function url(path: string) {
      return `${provider.issuer}/interaction${path}`;
    }

    const {idp, renderer, logger} = this.props;
    const router = this.router;
    const validate = this.validate.bind(this);
    const render = renderer.render.bind(renderer);
    const abort = {
      url: url(`/abort`),
      method: "POST",
      data: {},
    };

    // delegate error handling
    router.use((ctx: KoaContextWithOIDC, next) => {
      return next()
        .catch(error => render(ctx as any, {error}));
    });

    // abort interactions
    router.post("/abort", async ctx => {
      const {prompt, params} = await provider.interactionDetails(ctx.req, ctx.res);
      const redirect = await provider.interactionResult(ctx.req, ctx.res, {
        error: "access_denied",
        error_description: "end-user aborted interaction",
      }, {
        mergeWithLastSubmission: false,
      });

      return render(ctx, {
        redirect,
      });
    });

    // handle login
    router.get("/login", async ctx => {
      const {prompt, params} = await provider.interactionDetails(ctx.req, ctx.res);
      ctx.assert(prompt.name === "login");

      return render(ctx, {
        interaction: {
          name: "login",
          action: {
            submit: {
              url: url(`/login`),
              method: "POST",
              data: {
                email: params.login_hint || "",
                password: "",
              },
            },
            abort,
          },
        },
      });
    });

    router.post("/login", async ctx => {
      // assert prompt name
      const {prompt, params} = await provider.interactionDetails(ctx.req, ctx.res);
      ctx.assert(prompt.name === "login");

      const {email, password} = ctx.request.body;

      // 1. user enter email only
      if (typeof password === "undefined" || !password) {

        // 2. server validate email
        validate(ctx, {email: "email"});

        // 3. fetch identity
        const id = await idp.findByEmail(email);
        const {preferred_username, nickname, name} = await id.claims("id_token", "profile");

        return render(ctx, {
          interaction: {
            name: "login",
            action: {
              submit: {
                url: url(`/login`),
                method: "POST",
                data: {
                  email,
                  password: "",
                },
              },
              abort,
            },
            data: {
              email,
              name: preferred_username || nickname || name,
            },
          },
        });
      }

      // 4. user get the next page and enter password and server validate it
      validate(ctx, {
        email: "email",
        password: "string|empty:false",
      });

      // 5. check account password
      const identity = await idp.findByEmail(email);
      await idp.assertCredentials(identity.accountId, {password});

      // 6. finish interaction and give redirection uri
      const redirect = await provider.interactionResult(ctx.req, ctx.res, {
        // authentication/login prompt got resolved, omit if no authentication happened, i.e. the user
        // cancelled
        login: {
          account: identity.accountId,
          remember: true,
          // acr: string, // acr value for the authentication
          // remember: boolean, // true if provider should use a persistent cookie rather than a session one, defaults to true
          // ts: number, // unix timestamp of the authentication, defaults to now()
        },
      }, {
        mergeWithLastSubmission: true,
      });

      return render(ctx, {redirect});
    });

    /* 2. CONSENT */
    router.get("/consent", async ctx => {
      const {prompt, params, session} = await provider.interactionDetails(ctx.req, ctx.res);

      // fetch identity and client
      const id = (await idp.find(session!.accountId))!;
      const client = (await provider.Client.find(params.client_id))!;
      ctx.assert(prompt.name === "consent" && client && id);

      const {email, preferred_username, nickname, name} = await id.claims("id_token", "profile email");

      return render(ctx, {
        interaction: {
          name: "consent",
          action: {
            submit: {
              url: url(`/consent`),
              method: "POST",
              data: {
                rejectedScopes: [], // array of strings, scope names the end-user has not granted
                rejectedClaims: [], // array of strings, claim names the end-user has not granted
              },
            },
            abort,
          },
          data: {
            email,
            name: preferred_username || nickname || name,
            client: getPublicClientProps(client as any),
            ...prompt.details,
          },
        },
      });
    });

    router.post("/consent", async ctx => {
      const {prompt, params} = await provider.interactionDetails(ctx.req, ctx.res);
      ctx.assert(prompt.name === "consent");

      // 1. validate body
      validate(ctx, {
        rejectedScopes: {
          type: "array",
          items: "string",
        },
        rejectedClaims: {
          type: "array",
          items: "string",
        },
      });

      // 2. finish interaction and give redirection uri
      const redirect = await provider.interactionResult(ctx.req, ctx.res, {
        // consent was given by the user to the client for this session
        consent: ctx.request.body,
      }, {
        mergeWithLastSubmission: true,
      });
      return render(ctx, {redirect});
    });

    return router.routes();
  }
}
