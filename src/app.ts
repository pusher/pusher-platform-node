import extend = require("extend");
import {IncomingMessage, ServerResponse} from "http";
import * as jwt from "jsonwebtoken";

import Authenticator from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions} from "./common";

import Permissions from "./permissions"

export interface Options {
  cluster: string;
  appId: string;
  appKey: string;
  client?: BaseClient;
}

export default class App {
  private client: BaseClient;
  private appId: string;
  private appKeyId: string;
  private appKeySecret: string;

  private authenticator: Authenticator;

  public permissions: Permissions;

  constructor(options: Options) {
    this.appId = options.appId;

    let keyParts = options.appKey.match(/^([^:]+):(.+)$/);
    if (!keyParts) {
      throw new Error("Invalid app key");
    }
    this.appKeyId = keyParts[1];
    this.appKeySecret = keyParts[2];

    this.client = options.client || new BaseClient({
      host: options.cluster || "api.private-beta-1.pusherplatform.com",
    });

    this.authenticator = new Authenticator(
      this.appId, this.appKeyId, this.appKeySecret
    );

    this.permissions = new Permissions(this);
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
    let path = `/${prefix}/${this.appId}/${options.path}`
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
      app: this.appId,
      iss: this.appKeyId,
      su: true,
      iat: now - 30,   // some leeway for the server
      exp: now + 60*5, // 5 minutes should be enough for a single request
    };
    return jwt.sign(claims, this.appKeySecret);
  }
}
