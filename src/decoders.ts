import {Readable} from "stream";

class BufferedDecoder {
  private buffer: Buffer;

  constructor(
      private response: Readable,
      private resolve: (result: Buffer) => void,
      private reject: (error: any) => void) { // FIXME
    this.buffer = new Buffer(0);

    this.response.on("data", (data) => {
      if (typeof data === "string") {
        this.buffer.write(data);
      } else {
        this.buffer = Buffer.concat([this.buffer, data]);
      }
    });
    this.response.on("error", (error) => {
      this.reject(error);
    });
    this.response.on("end", () => {
      this.resolve(this.buffer);
    });
  }
}

export function readBuffer(response: Readable): Promise<Buffer> {
  return new Promise<Buffer>(function(resolve, reject) {
    new BufferedDecoder(response, resolve, reject);
  });
}

export function readString(response: Readable): Promise<string> {
  return readBuffer(response).then(function(result) {
    return result.toString();
  });
}

export function readJSON(response: Readable): Promise<any> {
  return readString(response).then(function(result) {
    return JSON.parse(result);
  });
}
