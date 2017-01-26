import {Readable} from "stream";

export function writeBuffer(buffer: Buffer): Readable {
  let stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function writeString(buffer: string): Readable {
  let stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function writeJSON(object: any): Readable {
  return writeString(JSON.stringify(object));
}
