import extend = require("extend");
import {IncomingMessage} from "http";
import {IncomingMessageWithBody} from "./common";
import * as jwt from "jsonwebtoken";

import Authenticator, { TokenWithExpiry, AuthenticationResponse } from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions} from "./common";

export interface Options {
  cluster: string;
  serviceId: string;
  serviceKey: string;
  client?: BaseClient;
}

export default class App {
  private client: BaseClient;
  private serviceId: string;
  private serviceKeyId: string;
  private serviceKeySecret: string;

  private authenticator: Authenticator;

  constructor(options: Options) {
    this.serviceId = options.serviceId;

    let keyParts = options.serviceKey.match(/^([^:]+):(.+)$/);
    if (!keyParts) {
      throw new Error("Invalid app key");
    }
    this.serviceKeyId = keyParts[1];
    this.serviceKeySecret = keyParts[2];

    this.client = options.client || new BaseClient({
      host: options.cluster,
    });

    this.authenticator = new Authenticator(
      this.serviceId, this.serviceKeyId, this.serviceKeySecret
    );
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    if (options.jwt == null) {
      options = extend(options, { jwt: this.generateSuperuserJWT() });
    }
    return this.client.request(options);
  }

  authenticate(request: IncomingMessageWithBody, options: AuthenticateOptions): AuthenticationResponse {
    return this.authenticator.authenticate(request, options);
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    return this.authenticator.generateAccessToken(options);
  }

  private scopeRequestOptions(prefix: string, options: RequestOptions): RequestOptions {
    let path = `/${prefix}/${this.serviceId}/${options.path}`
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
      app: this.serviceId,
      iss: this.serviceKeyId,
      su: true,
      iat: now - 30,   // some leeway for the server
      exp: now + 60*5, // 5 minutes should be enough for a single request
    };
    return jwt.sign(claims, this.serviceKeySecret);
  }
}
