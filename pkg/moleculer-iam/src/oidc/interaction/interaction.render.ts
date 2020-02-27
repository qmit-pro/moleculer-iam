import { RouterContext } from "koa-router";
import compose from "koa-compose";
import { Logger } from "../../logger";
import { KoaContextWithOIDC, OIDCProviderDiscoveryMetadata } from "../provider";

export type InteractionRendererProps = {
  adaptor?: InteractionRendererAdaptor;
  logger: Logger;
  devModeEnabled: boolean;
}

export interface InteractionRendererAdaptor {
  routes(dev: boolean): compose.Middleware<any>[];
  render(props: InteractionRenderProps, dev: boolean): string | Promise<string>;
}

export interface InteractionActionEndpoints {
  [key: string]: {
    url: string;
    method: "POST"|"GET";
    payload?: any;
    urlencoded?: boolean;
    [key: string]: any;
  };
}

export interface InteractionRenderProps {
  interaction?: {
    name: string;
    data?: any;
    actions?: InteractionActionEndpoints;
  };

  // global metadata
  metadata?: OIDCProviderDiscoveryMetadata;

  // global error
  error?: {
    error?: string;
    error_description?: string;
    [key: string]: any;
  };

  // let client be redirected
  redirect?: string;
}

export class InteractionRenderer {
  public static contentTypes = {
    JSON: "application/json",
    HTML: "text/html",
  };

  constructor(private readonly props: InteractionRendererProps) {
    if (!props.adaptor) props.adaptor = loadDefaultInteractionRendererAdaptor(props.logger);
  }

  public routes(): compose.Middleware<any>[] {
    return this.props.adaptor!.routes(this.props.devModeEnabled);
  }

  public async render(ctx: KoaContextWithOIDC | RouterContext, props: InteractionRenderProps = {}): Promise<void> {
    const { JSON, HTML } = InteractionRenderer.contentTypes;

    // response for ajax
    if (ctx.accepts(JSON, HTML) === JSON) {
      ctx.type = JSON;
      ctx.body = props.error || props; // response error only for xhr request
      return;
    }

    // response redirection
    if (props.redirect) {
      ctx.status = 302;
      ctx.redirect(props.redirect);
      return;
    }

    // response HTML
    ctx.type = HTML;
    ctx.body = await this.props.adaptor!.render(props, this.props.devModeEnabled);
  }
}

function loadDefaultInteractionRendererAdaptor(logger: Logger): InteractionRendererAdaptor {
  try {
    // tslint:disable-next-line:no-var-requires
    return require("moleculer-iam-interaction-renderer");
  } catch (error) {
    logger.error(error);

    return {
      routes() {
        return [];
      },
      render(props) {
        return `
          <html>
              <body>
                  <div style="background-color:#9b0000; color: white; padding: 2em; font-family: monospace">
                      <p>OIDC interaction renderer has not been configured: can install 'moleculer-iam-interaction-renderer' or set oidc.renderer option.</p>
                      <pre>${JSON.stringify(error, null, 2)}</pre>
                  </div>
                  <hr>
                  <pre>${JSON.stringify(props, null, 2)}</pre>
              </body>
          </html>`;
      },
    };
  }
}
