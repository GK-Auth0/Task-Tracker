declare module 'jwks-client' {
  interface JwksClientOptions {
    jwksUri: string;
    cache?: boolean;
    cacheMaxEntries?: number;
    cacheMaxAge?: number;
    rateLimit?: boolean;
    jwksRequestsPerMinute?: number;
    timeout?: number;
  }

  interface SigningKey {
    getPublicKey(): string;
  }

  interface JwksClient {
    getSigningKey(kid: string): Promise<SigningKey>;
  }

  function jwksClient(options: JwksClientOptions): JwksClient;
  export = jwksClient;
}