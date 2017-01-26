import {IncomingMessage, ServerResponse} from "http";
import * as jwt from "jsonwebtoken";

import {AuthenticateOptions} from "./common";

const TOKEN_LEEWAY = 30;
const TOKEN_EXPIRY = 24*60*60;

export function authenticate(
    appID: string,
    appKeyID: string,
    appKeySecret: string,
    request: IncomingMessage,
    response: ServerResponse,
    options: AuthenticateOptions) {
  let body = (<any>request).body; // FIXME
  let grantType = body["grant_type"];

  if (grantType === "client_credentials") {
    let now = Math.floor(Date.now() / 1000);

    let accessClaims = {
      app: appID,
      iss: `keys/${appKeyID}`,
      iat: now - TOKEN_LEEWAY,
      exp: now + TOKEN_EXPIRY - TOKEN_LEEWAY,
    };
    let refreshClaims = {
      app: accessClaims.app,
      iss: accessClaims.iss,
      iat: now - TOKEN_LEEWAY,
      refresh: true,
    };

    let accessToken = jwt.sign(accessClaims, appKeySecret);
    let refreshToken = jwt.sign(refreshClaims, appKeySecret);

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      access_token: accessToken,
      token_type: "bearer",
      expires_in: TOKEN_EXPIRY,
      refresh_token: refreshToken,
    }));
  } else if (grantType === "refresh_token") {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      error: "invalid_grant"
    }));
  } else {
    // TODO add error_uri
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      error: "invalid_grant"
    }));
  }
}
