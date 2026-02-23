export type SignatureRenderFormat = 'png' | 'mp4';

export type SignatureRenderProps = {
  background?: string;
  signatureColor?: string;
  padding?: number;
  maxWidth?: number;
  fadeInFrames?: number;
};

export type RenderSignatureRequest = {
  format?: SignatureRenderFormat;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  props?: SignatureRenderProps;
  returnBase64?: boolean;
};

export type RenderSignatureResponse = {
  id: string;
  format: SignatureRenderFormat;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props: Required<SignatureRenderProps>;
  path: string;
  url: string;
  base64?: string;
};

export type SignatureRuntimeClientOptions = {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
};

export class SignatureRuntimeClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(options: SignatureRuntimeClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 120000;
    this.retries = options.retries ?? 2;
  }

  async health(): Promise<{ ok: boolean; service: string; outputDir: string }> {
    return this.fetchJson('/health', { method: 'GET' });
  }

  async renderSignature(
    input: RenderSignatureRequest,
  ): Promise<RenderSignatureResponse> {
    return this.fetchJson('/render-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  private async fetchJson(path: string, init: RequestInit): Promise<any> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
          const message =
            data?.error ??
            `Signature runtime request failed (${response.status})`;
          throw new Error(message);
        }

        return data;
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        if (attempt < this.retries) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Signature runtime request failed');
  }
}
