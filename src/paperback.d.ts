declare global {
  var Application: {
    scheduleRequest(request: PaperbackRequest): Promise<[PaperbackResponse, ArrayBuffer]>;
    arrayBufferToUTF8String(buffer: ArrayBuffer): string;
    getDefaultUserAgent(): Promise<string>;
    getState(key: string): unknown;
    setState(value: unknown, key: string): void;
    registerInterceptor(
      id: string,
      requestSelector: unknown,
      responseSelector: unknown
    ): void;
    Selector(target: unknown, selector: string): unknown;
  };
}

export type PaperbackRequest = {
  url: string;
  method: "GET" | "POST" | "HEAD";
  headers?: Record<string, string>;
  body?: unknown;
  cookies?: Record<string, string>;
};

export type PaperbackResponse = {
  status: number;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string; path?: string; expires?: Date }>;
};

export {};
