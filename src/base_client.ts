import extend = require("extend");
import {IncomingMessage} from "http";
import * as https from "https";
import {Readable} from "stream";

import {RequestOptions, ErrorResponse} from "./common";
import {readJSON} from "./decoders";

export interface Options {
  host: string;
}

export default class BaseClient {
  private host: string;

  constructor(options?: Options) {
    this.host = options.host;
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    var headers: any = {};

    if (options.headers) {
      for (var key in options.headers) {
        headers[key] = options.headers[key];
      }
    }
    if (options.jwt) {
      headers["Authorization"] = `Bearer ${options.jwt}`
    }

    var sendOptions = {
      host: this.host,
      method: options.method,
      path: options.path,
      headers: headers,
    };
    var request = https.request(sendOptions);

    return new Promise<IncomingMessage>(function(resolve, reject) {
      function onRequestError(error: any) {
        unbind();
        reject(error);
      }
      function onResponse(response: IncomingMessage) {
        unbind();
        let statusCode = response.statusCode;
        if (statusCode >= 200 && statusCode <= 299) {
          resolve(response);
        } else if (statusCode >= 300 && statusCode <= 399) {
          reject(new Error(`Unsupported Redirect Response: ${statusCode}`));
        } else if (statusCode >= 400 && statusCode <= 599) {
          readJSON(response).then(function(errorDescription) {
            reject(
              new ErrorResponse(statusCode, response.headers, errorDescription)
            );
          }).catch(function(error) {
            // FIXME we should probably return raw body
            reject(
              new ErrorResponse(statusCode, response.headers, undefined)
            );
          });
        } else {
          reject(new Error(`Unsupported Response Code: ${statusCode}`));
        }
      }
      function unbind() {
        request.removeListener("response", onResponse);
        request.removeListener("error", onResponse);
      }

      request.addListener("response", onResponse);
      request.addListener("error", onRequestError);

      if (options.body) {
        options.body.pipe(request);
      } else {
        request.end();
      }
    });
  }
}
