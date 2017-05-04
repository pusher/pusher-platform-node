import extend = require("extend");
import {IncomingMessage, ServerResponse} from "http";

import Authenticator from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions} from "./common";

import Feed from "./feed";

export interface Options {
  cluster?: string;
  appId: string;
  client?: BaseClient;
  authenticator?: Authenticator;
}

export default class App {
  private client: BaseClient;
  private appId: string;

  constructor(private options: Options) {
    this.appId = options.appId;

    this.client = options.client || new BaseClient({
      host: options.cluster || "api.private-beta-1.pusherplatform.com",
    });
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    if (options.jwt == null && this.options.authenticator) {
      options = extend(options, { jwt: this.options.authenticator.generateSuperuserJWT() });
    }
    return this.client.request(options);
  }

  configRequest(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("config/apps", options);
    if (options.jwt == null && this.options.authenticator) {
      options = extend(options, { jwt: this.options.authenticator.generateSuperuserJWT() });
    }
    return this.client.request(options);
  }

  authenticate(request: IncomingMessage, response: ServerResponse, options: AuthenticateOptions) {
    if (this.options.authenticator) {
      this.options.authenticator.authenticate(request, response, options);
    } else {
      throw new Error("Cannot authenticate without an authenticator");
    }
  }

  feed(name: string): Feed {
    return new Feed(name, this);
  }

  private scopeRequestOptions(prefix: string, options: RequestOptions): RequestOptions {
    let path = `/${prefix}/${this.appId}/${options.path}`
      .replace(/\/+/g, "/")
      .replace(/\/+$/, "");
    return extend(
      options,
      { path: path }
    );
  }
}
