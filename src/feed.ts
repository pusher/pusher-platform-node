import {IncomingMessage} from "http";
import App from "./app";

import stream = require("stream");

export default class Feed {
  constructor(private name: string, private app: App) { }
  publish(item: any): Promise<IncomingMessage> {
    var s: stream.Readable = new stream.Readable();
    s.push(JSON.stringify({items: [item]}));
    s.push(null);
    return this.app.request({
      method: "POST",
      path: "feeds/" + this.name,
      body: s
    });
  }
}
