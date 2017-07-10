import extend = require("extend");
import {IncomingMessage} from "http";
import {IncomingMessageWithBody} from "./common";
import * as jwt from "jsonwebtoken";

import Authenticator, {
  TokenWithExpiry, AuthenticationResponse, TOKEN_LEEWAY
} from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions} from "./common";

// 5 minutes should be enough for a single sudo request
const SUPERUSER_TOKEN_EXPIRY = 60*5;

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

  constructor(options: Options) {
    this.appId = options.appId;

    let keyParts = options.appKey.match(/^([^:]+):(.+)$/);
    if (!keyParts) {
      throw new Error("Invalid app key");
    }
    this.appKeyId = keyParts[1];
    this.appKeySecret = keyParts[2];

    this.client = options.client || new BaseClient({
      host: options.cluster,
    });

    this.authenticator = new Authenticator(
      this.appId, this.appKeyId, this.appKeySecret
    );
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    if (options.jwt == null) {
      options = extend(options, { jwt: this.generateSuperuserJWT().jwt });
    }
    return this.client.request(options);
  }

  authenticate(request: IncomingMessageWithBody, options: AuthenticateOptions): AuthenticationResponse {
    return this.authenticator.authenticate(request, options);
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    return this.authenticator.generateAccessToken(options);
  }

  generateSuperuserJWT() {
    let now = Math.floor(Date.now() / 1000);
    var claims = {
      app: this.appId,
      iss: this.appKeyId,
      su: true,
      iat: now - TOKEN_LEEWAY,
      exp: now + SUPERUSER_TOKEN_EXPIRY,
    };

    return {
      jwt: jwt.sign(claims, this.appKeySecret),
      expires_in: SUPERUSER_TOKEN_EXPIRY
    };
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
