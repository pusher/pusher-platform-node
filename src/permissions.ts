import {IncomingMessage, ServerResponse} from "http";
import {writeJSON} from "./encoders";
import {readJSON} from "./decoders";

import App from "./app"

export default class Permissions {
  private app: App;
  public anonymous: UserPermissions;
  public authenticated: UserPermissions;

  constructor(app: App) {
    this.app = app;
    this.anonymous = new UserPermissions('anonymous', this.app, true);
    this.authenticated = new UserPermissions('authenticated', this.app, true);
  }

  user(userId: string): UserPermissions {
    return new UserPermissions(userId, this.app, false);
  }

  feed(feedName: string): FeedPermissions {
    return new FeedPermissions(feedName, this.app)
  }
}

export class UserPermissions {
  public userId: string;
  private app: App;
  private predefinedUserType: boolean;

  constructor(userId: string, app: App, predefinedUserType: boolean) {
    this.userId = userId;
    this.app = app;
    this.predefinedUserType = predefinedUserType;
  }

  get(): Promise<any> {
    return this.app.configRequest({
      path: `/feeds/users/${this.userId}`,
      method: "GET"
    }).then(function(res) {
      return readJSON(res)
    })
  }

  add(options: any): Promise<any> {
    return this.updatePermissions("ADD", options)
  }

  remove(options: any): Promise<any> {
    return this.updatePermissions("DELETE", options)
  }

  private updatePermissions(operation: string, options: any): Promise<any> {
    return this.app.configRequest({
      path: `/feeds/users/${this.userId}`,
      method: "PATCH",
      body: writeJSON({
        feeds: options,
        operation: operation,
        predefinedUserType: this.predefinedUserType,
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(function(res) {
      return readJSON(res)
    })
  }
}

export class FeedPermissions {
  public feedName: string;
  private app: App;

  constructor(feedName: string, app: App) {
    this.feedName = feedName;
    this.app = app;
  }

  get(): Promise<any> {
    return this.app.configRequest({
      path: `/feeds/${this.feedName}`,
      method: "GET"
    }).then(function(res) {
      return readJSON(res)
    })
  }

  add(options: any): Promise<any> {
    return this.updatePermissions("ADD", options)
  }

  remove(options: any): Promise<any> {
    return this.updatePermissions("DELETE", options)
  }

  private updatePermissions(operation: string, options: any): Promise<any> {
    var mutableOptions = options;
    mutableOptions["operation"] = operation;
    return this.app.configRequest({
      path: `/feeds/${this.feedName}`,
      method: "PATCH",
      body: writeJSON(mutableOptions),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(function(res) {
      return readJSON(res)
    })
  }
}
