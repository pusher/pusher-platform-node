import {IncomingMessage} from "http";
import * as jwt from "jsonwebtoken";

import {AuthenticateOptions} from "./common";

const TOKEN_LEEWAY = 30;
const TOKEN_EXPIRY = 24*60*60;

const CLIENT_CREDENTIALS_GRANT_TYPE = "client_credentials";
const REFRESH_TOKEN_GRANT_TYPE = "refresh_token";

export interface TokenWithExpire {
  token: string;
  expire: number;
}

export interface RefreshToken {
  value: string;
}

export interface AuthenticationResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export default class Authenticator {
  constructor(
      private appId: string,
      private appKeyId: string,
      private appKeySecret: string) {

  }

  authenticate(request: IncomingMessage, options: AuthenticateOptions): Promise<AuthenticationResponse> {
    let body = (<any>request).body; // FIXME
    let grantType = body["grant_type"];
    
    switch (grantType) {
      case CLIENT_CREDENTIALS_GRANT_TYPE:
        return this.authenticateWithClientCredentials(options);
      case REFRESH_TOKEN_GRANT_TYPE:
        let oldRefreshToken = body[REFRESH_TOKEN_GRANT_TYPE];
        return this.authenticateWithRefreshToken(oldRefreshToken, options);
      default:
        throw new Error('unsupported_grant_type ' + 401);
    }
  }

  private authenticateWithClientCredentials(options: AuthenticateOptions): Promise<AuthenticationResponse> {
    return new Promise((resolve, reject) => {
      let {token} = this.generateAccessToken(options);
      let refreshToken = this.generateRefreshToken(options);
      
      resolve({
        access_token: token,
        token_type: "bearer",
        expires_in: TOKEN_EXPIRY,
        refresh_token: refreshToken.value,
      });
    });
  }

  private authenticateWithRefreshToken(oldRefreshToken: string, options: AuthenticateOptions): Promise<AuthenticationResponse> {
    return new Promise((resolve, reject) => {
      let decoded: any;

      try {
        decoded = jwt.verify(oldRefreshToken, this.appKeySecret, {
          issuer: `keys/${this.appKeyId}`,
          clockTolerance: TOKEN_LEEWAY,
        });
      } catch (e) {
        let description: string;
        if (e instanceof jwt.TokenExpiredError) {
          description = "refresh token has expired";
        } else {
          description = "refresh token is invalid";
        }
        reject(new Error("invalid_grant "+ description + "  " + 401));
        return;
      }

      if (decoded.refresh !== true) {
        reject(new Error("invalid_grant " + "refresh token does not have a refresh claim " + 401));
        return;
      }

      if (options.userId !== decoded.sub) {
        reject(new Error("invalid_grant " + "refresh token has an invalid user id " + 401));
        return;
      }

      let newAccessToken = this.generateAccessToken(options);
      let newRefreshToken = this.generateRefreshToken(options);
      resolve({
        access_token: newAccessToken,
        token_type: "bearer",
        expires_in: TOKEN_EXPIRY,
        refresh_token: newRefreshToken.value,
      });
    })

  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpire {
    let now = Math.floor(Date.now() / 1000);
    let expire = now + TOKEN_EXPIRY - TOKEN_LEEWAY;

    let claims = {
      app: this.appId,
      iss: this.appKeyId,
      iat: now - TOKEN_LEEWAY,
      exp: expire,
      sub: options.userId,
      ...options.serviceClaims,
    };

    return {
      token: jwt.sign(claims, this.appKeySecret),
      expire: expire,
    };
  }

  private generateRefreshToken(options: AuthenticateOptions): RefreshToken {
    let now = Math.floor(Date.now() / 1000);

    let claims = {
      app: this.appId,
      iss: this.appKeyId,
      iat: now - TOKEN_LEEWAY,
      refresh: true,
      sub: options.userId,
    };

    return {
      value: jwt.sign(claims, this.appKeySecret),
    };
  }
}
