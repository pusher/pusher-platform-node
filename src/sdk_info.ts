export default class SDKInfo {
  readonly productName: string;
  readonly version: string;
  readonly language: string;
  readonly platform: string;
  readonly headers: SDKInfoHeaders;

  constructor(options: {
    productName: string,
    version: string,
    language?: string,
    platform?: string,
  }) {
    this.productName = options.productName;
    this.version = options.version;
    this.language = options.language || 'node';
    this.platform = options.platform || 'server';

    this.headers = {
      "X-SDK-Product": this.productName,
      "X-SDK-Version": this.version,
      "X-SDK-Language": this.language,
      "X-SDK-Platform": this.platform,
    }
  }
}

export interface SDKInfoHeaders {
  "X-SDK-Product": string;
  "X-SDK-Version": string;
  "X-SDK-Language": string;
  "X-SDK-Platform": string;
}
