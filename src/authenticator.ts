import {IncomingMessage, ServerResponse} from "http";
import * as jwt from "jsonwebtoken";

import {AuthenticateOptions} from "./common";

const TOKEN_LEEWAY = 30;
const TOKEN_EXPIRY = 24*60*60;

export interface TokenWithExpiry {
  token: string;
  expires_in: number;
}

export interface RefreshToken {
  token: string;
}

export default class Authenticator {
  constructor(
      private appId: string,
      private appKeyId: string,
      private appKeySecret: string) {

  }

  authenticate(request: IncomingMessage, response: ServerResponse, options: AuthenticateOptions) {
    let body = (<any>request).body; // FIXME
    let grantType = body["grant_type"];

    if (grantType === "client_credentials") {
      this.authenticateWithClientCredentials(response, options);
    } else if (grantType === "refresh_token") {
      let oldRefreshToken = body["refresh_token"];
      this.authenticateWithRefreshToken(oldRefreshToken, response, options);
    } else {
      writeResponse(response, 401, {
        error: "unsupported_grant_type",
        // TODO error_uri
      });
    }
  }

  private authenticateWithClientCredentials(response: ServerResponse, options: AuthenticateOptions) {
    let {token} = this.generateAccessToken(options);
    let refreshToken = this.generateRefreshToken(options);
    writeResponse(response, 200, {
      access_token: token,
      token_type: "bearer",
      expires_in: TOKEN_EXPIRY,
      refresh_token: refreshToken.token,
    });
  }

  private authenticateWithRefreshToken(oldRefreshToken: string, response: ServerResponse, options: AuthenticateOptions) {
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
      writeResponse(response, 401, {
        error: "invalid_grant",
        error_description: description,
        // TODO error_uri
      });
      return;
    }

    if (decoded.refresh !== true) {
      writeResponse(response, 401, {
        error: "invalid_grant",
        error_description: "refresh token does not have a refresh claim",
        // TODO error_uri
      });
      return;
    }

    if (options.userId !== decoded.sub) {
      writeResponse(response, 401, {
        error: "invalid_grant",
        error_description: "refresh token has an invalid user id",
        // TODO error_uri
      });
      return;
    }

    let newAccessToken = this.generateAccessToken(options);
    let newRefreshToken = this.generateRefreshToken(options);
    writeResponse(response, 200, {
      access_token: newAccessToken,
      token_type: "bearer",
      expires_in: TOKEN_EXPIRY,
      refresh_token: newRefreshToken.token,
    });
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    let now = Math.floor(Date.now() / 1000);

    let claims = {
      app: this.appId,
      iss: `keys/${this.appKeyId}`,
      iat: now - TOKEN_LEEWAY,
      exp: now + TOKEN_EXPIRY - TOKEN_LEEWAY,
      sub: options.userId,
      ...options.serviceClaims,
    };

    return {
      token: jwt.sign(claims, this.appKeySecret),
      expires_in: TOKEN_EXPIRY,
    };
  }

  private generateRefreshToken(options: AuthenticateOptions): RefreshToken {
    let now = Math.floor(Date.now() / 1000);

    let claims = {
      app: this.appId,
      iss: `keys/${this.appKeyId}`,
      iat: now - TOKEN_LEEWAY,
      refresh: true,
      sub: options.userId,
    };

    return {
      token: jwt.sign(claims, this.appKeySecret),
    };
  }
}

function writeResponse(response: ServerResponse, statusCode: number, body: any) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
