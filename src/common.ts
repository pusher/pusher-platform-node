import {Readable} from "stream";

export type Headers = {
  [key: string]: string;
};

export class ErrorResponse {
  constructor(
    public readonly statusCode: number,
    public readonly headers: Headers,
    public readonly description: any) {

  }
}

export interface RequestOptions {
  method: string;
  path: string;
  jwt?: string;
  headers?: Headers;
  body?: Readable;
}

export interface AuthenticateOptions {
  userId: string;
  serviceClaims: any;
}
