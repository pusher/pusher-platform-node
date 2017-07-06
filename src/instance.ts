import extend = require("extend");
import {IncomingMessage} from "http";
import {IncomingMessageWithBody} from "./common";
import * as jwt from "jsonwebtoken";

import Authenticator, {
  TokenWithExpiry, AuthenticationResponse, TOKEN_LEEWAY
} from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions, AuthenticatePayload} from "./common";

// 5 minutes should be enough for a single sudo request
const SUPERUSER_TOKEN_EXPIRY = 60*5;

const HOST_BASE = "pusherplatform.io";
const HTTPS_PORT = 443;

export interface InstanceOptions {
  instance: string;
  key: string;
  serviceName: string;
  serviceVersion: string;

  port?: number;
  host?: string;
  client?: BaseClient;
}

export default class Instance {
  private client: BaseClient;
  private instanceId: string;
  private serviceName: string;
  private serviceVersion: string;
  private cluster: string;
  private platformVersion: string;

  private keyId: string;
  private keySecret: string;
  private host: string;

  private authenticator: Authenticator;

  constructor(options: InstanceOptions) {

    if (!options.instance) throw new Error('Expected `instance` property in Instance options!');
    if (options.instance.split(":").length !== 3) throw new Error('The instance property is in the wrong format!');
    if(!options.serviceName) throw new Error('Expected `serviceName` property in Instance options!');
    if(!options.serviceVersion) throw new Error('Expected `serviceVersion` property in Instance otpions!');

    let splitInstance = options.instance.split(":");
    this.platformVersion = splitInstance[0];
    this.cluster = splitInstance[1];
    this.instanceId = splitInstance[2];

    this.serviceName = options.serviceName;
    this.serviceVersion = options.serviceVersion;

    let keyParts = options.key.match(/^([^:]+):(.+)$/);
    if (!keyParts) {
      throw new Error("Invalid instance key");
    }
    this.keyId = keyParts[1];
    this.keySecret = keyParts[2];

    let host = `${this.cluster}.${HOST_BASE}`
    if(options.host) {
      host = options.host;
    }
    let port = HTTPS_PORT;
    if(options.port){
      port = options.port;
    }

    this.client = options.client || new BaseClient({
      host: host,
      instanceId: this.instanceId,
      serviceName: this.serviceName,
      serviceVersion: this.serviceVersion,
      port: port
    });

    this.authenticator = new Authenticator(
      this.instanceId, this.keyId, this.keySecret
    );
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    if (options.jwt == null) {
      options = extend(options, { jwt: this.generateSuperuserJWT().jwt });
    }
    return this.client.request(options);
  }

  authenticate(authenticatePayload: AuthenticatePayload, options: AuthenticateOptions): AuthenticationResponse {
    return this.authenticator.authenticate(authenticatePayload, options);
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    return this.authenticator.generateAccessToken(options);
  }
  
  generateSuperuserJWT() {
    let now = Math.floor(Date.now() / 1000);
    var claims = {
      app: this.instanceId,
      iss: this.keyId,
      su: true,
      iat: now - TOKEN_LEEWAY,
      exp: now + SUPERUSER_TOKEN_EXPIRY,
    };

    return {
      jwt: jwt.sign(claims, this.keySecret),
      expires_in: SUPERUSER_TOKEN_EXPIRY
    };
  }

  private scopeRequestOptions(prefix: string, options: RequestOptions): RequestOptions {
    let path = `/${prefix}/${this.instanceId}/${options.path}`
      .replace(/\/+/g, "/")
      .replace(/\/+$/, "");
    return extend(
      options,
      { path: path }
    );
  }
}
