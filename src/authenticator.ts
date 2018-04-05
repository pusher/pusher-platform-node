import {IncomingMessage} from "http";
import * as jwt from 'jsonwebtoken';

import {AuthenticateOptions, AuthenticatePayload} from "./common";
import {UnsupportedGrantTypeError, InvalidGrantTypeError} from "./errors";

const DEFAULT_TOKEN_EXPIRY = 24*60*60;
const CLIENT_CREDENTIALS_GRANT_TYPE = "client_credentials";
const REFRESH_TOKEN_GRANT_TYPE = "refresh_token";

export interface TokenWithExpiry {
  token: string;
  expires_in: number;
}

export interface RefreshToken {
  token: string;
}

export interface AuthenticationResponse {
  access_token: string | TokenWithExpiry;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export default class Authenticator {
  constructor(
    private instanceId: string,
    private instanceKeyId: string,
    private instanceKeySecret: string,

    //Customise token expiry
    private tokenExpiry?: number,
  ) {
    if(!this.tokenExpiry) { this.tokenExpiry = DEFAULT_TOKEN_EXPIRY; }
  }

  authenticate(authenticatePayload: AuthenticatePayload, options: AuthenticateOptions): AuthenticationResponse {
    let grantType = authenticatePayload["grant_type"];

    switch (grantType) {
      case CLIENT_CREDENTIALS_GRANT_TYPE:
        return this.authenticateWithClientCredentials(options);
      case REFRESH_TOKEN_GRANT_TYPE:
        let oldRefreshToken = authenticatePayload[REFRESH_TOKEN_GRANT_TYPE];
        return this.authenticateWithRefreshToken(oldRefreshToken, options);
      default:
        throw new UnsupportedGrantTypeError(`Requested type: "${grantType}" is not supported`);
    }
  }

  private authenticateWithClientCredentials(options: AuthenticateOptions): AuthenticationResponse {
    let {token} = this.generateAccessToken(options);
    let refreshToken = this.generateRefreshToken(options);
    let tokenExpiry = options.tokenExpiry || this.tokenExpiry;

    return {
      access_token: token,
      token_type: "bearer",
      expires_in: tokenExpiry,
      refresh_token: refreshToken.token,
    };
  }

  private authenticateWithRefreshToken(oldRefreshToken: string, options: AuthenticateOptions): AuthenticationResponse {
      let decoded: any;
      let tokenExpiry = options.tokenExpiry || this.tokenExpiry;

      try {
        decoded = jwt.verify(oldRefreshToken, this.instanceKeySecret, {
          issuer: `api_keys/${this.instanceKeyId}`,
        });
      } catch (e) {
        let description: string = (e instanceof jwt.TokenExpiredError) ? "refresh token has expired" : "refresh token is invalid";
        throw new InvalidGrantTypeError(description);
      }

      if (decoded.refresh !== true) {
        throw new InvalidGrantTypeError("refresh token does not have a refresh claim");
      }

      if (options.userId !== decoded.sub) {
        throw new InvalidGrantTypeError("refresh token has an invalid user id");
      }

      let newAccessToken = this.generateAccessToken(options);
      let newRefreshToken = this.generateRefreshToken(options);

      return {
        access_token: newAccessToken,
        token_type: "bearer",
        expires_in: tokenExpiry,
        refresh_token: newRefreshToken.token,
      };
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    let now = Math.floor(Date.now() / 1000);
    let tokenExpiry = options.tokenExpiry || this.tokenExpiry;

    let claims = {
      instance: this.instanceId,
      iss: `api_keys/${this.instanceKeyId}`,
      iat: now,
      exp: now + tokenExpiry,
      sub: options.userId,
      su: options.su,
      ...options.serviceClaims
    };

    return {
      token: jwt.sign(claims, this.instanceKeySecret),
      expires_in: tokenExpiry,
    };
  }

  private generateRefreshToken(options: AuthenticateOptions): RefreshToken {
    let now = Math.floor(Date.now() / 1000);

    let claims = {
      instance: this.instanceId,
      iss: `api_keys/${this.instanceKeyId}`,
      iat: now,
      refresh: true,
      sub: options.userId,
    };

    return {
      token: jwt.sign(claims, this.instanceKeySecret),
    };
  }
}
