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
    authenticateWithClientCredentials(appID, appKeyID, appKeySecret, response);
  } else if (grantType === "refresh_token") {
    let oldRefreshToken = body["refresh_token"];
    authenticateWithRefreshToken(appID, appKeyID, appKeySecret, oldRefreshToken, response);
  } else {
    writeResponse(response, 401, {
      error: "unsupported_grant_type",
      // TODO error_uri
    });
  }
}

function authenticateWithClientCredentials(
    appID: string,
    appKeyID: string,
    appKeySecret: string,
    response: ServerResponse) {
  let accessToken = generateAccessToken(appID, appKeyID, appKeySecret);
  let refreshToken = generateRefreshToken(appID, appKeyID, appKeySecret);
  writeResponse(response, 200, {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: TOKEN_EXPIRY,
    refresh_token: refreshToken,
  });
}

function authenticateWithRefreshToken(
    appID: string,
    appKeyID: string,
    appKeySecret: string,
    oldRefreshToken: string,
    response: ServerResponse) {
  let decoded: any;

  try {
    decoded = jwt.verify(oldRefreshToken, appKeySecret, {
      issuer: `keys/${appKeyID}`,
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

  // TODO check sub

  let newAccessToken = generateAccessToken(appID, appKeyID, appKeySecret);
  let newRefreshToken = generateRefreshToken(appID, appKeyID, appKeySecret);
  writeResponse(response, 200, {
    access_token: newAccessToken,
    token_type: "bearer",
    expires_in: TOKEN_EXPIRY,
    refresh_token: newRefreshToken,
  });
}

function generateAccessToken(appID: string, appKeyID: string, appKeySecret: string): string {
  let now = Math.floor(Date.now() / 1000);

  let claims = {
    app: appID,
    iss: `keys/${appKeyID}`,
    iat: now - TOKEN_LEEWAY,
    exp: now + TOKEN_EXPIRY - TOKEN_LEEWAY,
    // TODO sub
  };

  return jwt.sign(claims, appKeySecret);
}

function generateRefreshToken(appID: string, appKeyID: string, appKeySecret: string): string {
  let now = Math.floor(Date.now() / 1000);

  let claims = {
    app: appID,
    iss: `keys/${appKeyID}`,
    iat: now - TOKEN_LEEWAY,
    refresh: true,
    // TODO sub
  };

  return jwt.sign(claims, appKeySecret);
}

function writeResponse(response: ServerResponse, statusCode: number, body: any) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
