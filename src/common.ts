export type Headers = {
  [key: string]: string | string[];
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
  body?: any;
}

export interface AuthenticateOptions {
  userId?: string;
  serviceClaims?: any;
  su?: boolean
}

export interface AuthenticatePayload {
  grant_type?: string;
  refresh_token?: string;
}
