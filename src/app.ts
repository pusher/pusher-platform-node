import extend = require("extend");
import {IncomingMessage, ServerResponse} from "http";
import * as jwt from "jsonwebtoken";

import Authenticator from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions} from "./common";

export interface Options {
  cluster: string;
  appID: string;
  appKey: string;
  client?: BaseClient;
}

export default class App {
  private client: BaseClient;
  private appID: string;
  private appKeyID: string;
  private appKeySecret: string;

  private authenticator: Authenticator;

  constructor(options: Options) {
    this.appID = options.appID;

    let keyParts = options.appKey.match(/^([^:]+):(.+)$/);
    if (!keyParts) {
      throw new Error("Invalid app key");
    }
    this.appKeyID = keyParts[1];
    this.appKeySecret = keyParts[2];

    this.client = options.client || new BaseClient({
      host: options.cluster,
    });

    this.authenticator = new Authenticator(
      this.appID, this.appKeyID, this.appKeySecret
    );
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    if (options.jwt == null) {
      options = extend(options, { jwt: this.generateSuperuserJWT() });
    }
    return this.client.request(options);
  }

  configRequest(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("config/apps", options);
    if (options.jwt == null) {
      options = extend(options, { jwt: this.generateSuperuserJWT() });
    }
    return this.client.request(options);
  }

  authenticate(request: IncomingMessage, response: ServerResponse, options: AuthenticateOptions) {
    this.authenticator.authenticate(request, response, options);
  }

  private scopeRequestOptions(prefix: string, options: RequestOptions): RequestOptions {
    let path = `/${prefix}/${this.appID}/${options.path}`
      .replace(/\/+/g, "/")
      .replace(/\/+$/, "");
    return extend(
      options,
      { path: path }
    );
  }

  private generateSuperuserJWT() {
    let now = Math.floor(Date.now() / 1000);
    var claims = {
      app: this.appID,
      iss: `keys/${this.appKeyID}`,
      su: true,
      iat: now - 30,   // some leeway for the server
      exp: now + 60*5, // 5 minutes should be enough for a single request
    };
    return jwt.sign(claims, this.appKeySecret);
  }
}
