import extend = require("extend");
import {IncomingMessage} from "http";

import BaseClient from "./base_client";
import {RequestOptions} from "./common";

export interface Options {
  cluster: string;
  appID: string;
  appKey: string;
  client?: BaseClient;
}

export default class App {
  private client: BaseClient;
  private appID: string;
  private appKey: string;

  constructor(options: Options) {
    this.appID = options.appID;
    this.appKey = options.appKey;

    this.client = options.client || new BaseClient({
      host: options.cluster,
    });
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    return this.client.request(options);
  }

  configRequest(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("config/apps", options);
    return this.client.request(options);
  }

  private scopeRequestOptions(prefix: string, options: RequestOptions): RequestOptions {
    let path = `/${prefix}/${this.appID}/${options.path}`
      .replace(/\/+/g, "/")
      .replace(/\/+$/, "");
    return extend(
      options,
      { path: path }
    );
  }
}
