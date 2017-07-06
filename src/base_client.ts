import extend = require("extend");
import {IncomingMessage} from "http";
import * as https from "https";
import {Readable} from "stream";

import {RequestOptions, ErrorResponse} from "./common";
import {readJSON} from "./decoders";

export interface BaseClientOptions {
  host: string;
  port: number;
  serviceName: string;
  serviceVersion: string;
  instanceId: string;
}

export default class BaseClient {
  private host: string;
  private port: number;
  private serviceName: string;
  private serviceVersion: string;
  private instanceId: string;

  constructor(options?: BaseClientOptions) {
    this.host = options.host;
    this.port = options.port
    this.serviceName = options.serviceName;
    this.serviceVersion = options.serviceVersion;
    this.instanceId = options.instanceId;
  }

  /**
   * Make a HTTPS request to a service running on Elements.
   * It will construct a valid elements URL from its serviceName, serviceVersion and instanceId that were passed to the Instance at construction time.
   */
  request(options: RequestOptions): Promise<IncomingMessage> {
    var headers: any = {};
    
    let path = `services/${this.serviceName}/${this.serviceVersion}/${this.instanceId}/${options.path}`;

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
      port: this.port,
      method: options.method,
      path: path,
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
