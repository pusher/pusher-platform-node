import {IncomingMessage} from "http";
import * as jwt from "jsonwebtoken";

import {AuthenticateOptions, IncomingMessageWithBody} from "./common";
import {UnsupportedGrantTypeError, InvalidGrantTypeError} from "./errors";

const TOKEN_LEEWAY = 30;
const TOKEN_EXPIRY = 24*60*60;
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
      private serviceId: string,
      private serviceKeyId: string,
      private serviceKeySecret: string) {

  }

  authenticate(request: IncomingMessageWithBody, options: AuthenticateOptions): AuthenticationResponse {
    let body = request.body; // FIXME - we should figure out better way then just rely on express.js body parser.
    let grantType = body["grant_type"];

    switch (grantType) {
      case CLIENT_CREDENTIALS_GRANT_TYPE:
        return this.authenticateWithClientCredentials(options);
      case REFRESH_TOKEN_GRANT_TYPE:
        let oldRefreshToken = body[REFRESH_TOKEN_GRANT_TYPE];
        return this.authenticateWithRefreshToken(oldRefreshToken, options);
      default:
        throw new UnsupportedGrantTypeError(`Requested type: "${grantType}" is not supported`);
    }
  }

  private authenticateWithClientCredentials(options: AuthenticateOptions): AuthenticationResponse {
    let {token} = this.generateAccessToken(options);
    let refreshToken = this.generateRefreshToken(options);
    
    return {
      access_token: token,
      token_type: "bearer",
      expires_in: TOKEN_EXPIRY,
      refresh_token: refreshToken.token,
    };
  }

  private authenticateWithRefreshToken(oldRefreshToken: string, options: AuthenticateOptions): AuthenticationResponse {
      let decoded: any;

      try {
        decoded = jwt.verify(oldRefreshToken, this.serviceKeySecret, {
          issuer: `keys/${this.serviceKeyId}`,
          clockTolerance: TOKEN_LEEWAY,
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
        expires_in: TOKEN_EXPIRY,
        refresh_token: newRefreshToken.token,
      };
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    let now = Math.floor(Date.now() / 1000);

    let claims = {
      app: this.serviceId,
      iss: `api_keys/${this.serviceKeyId}`,
      iat: now - TOKEN_LEEWAY,
      exp: now + TOKEN_EXPIRY - TOKEN_LEEWAY,
      sub: options.userId,
      ...options.serviceClaims,
    };

    return {
      token: jwt.sign(claims, this.serviceKeySecret),
      expires_in: TOKEN_EXPIRY,
    };
  }

  private generateRefreshToken(options: AuthenticateOptions): RefreshToken {
    let now = Math.floor(Date.now() / 1000);

    let claims = {
      app: this.serviceId,
      iss: `api_keys/${this.serviceKeyId}`,
      iat: now - TOKEN_LEEWAY,
      refresh: true,
      sub: options.userId,
    };

    return {
      token: jwt.sign(claims, this.serviceKeySecret),
    };
  }
}
