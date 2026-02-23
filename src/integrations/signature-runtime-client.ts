export type RenderFormat = 'png' | 'mp4' | 'gif';

// Generic render types — works with any composition
export type RenderAssetRequest = {
  compositionId: string;
  format?: RenderFormat;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  props?: Record<string, unknown>;
  returnBase64?: boolean;
};

export type RenderAssetResponse = {
  id: string;
  compositionId: string;
  format: RenderFormat;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props: Record<string, unknown>;
  path: string;
  url: string;
  base64?: string;
};

export type CompositionInfo = {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};

// Signature-specific types (convenience aliases)
export type SignatureRenderFormat = RenderFormat;

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

export type RenderSignatureResponse = RenderAssetResponse;

export type SignatureRuntimeClientOptions = {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  retries?: number;
};

export class SignatureRuntimeClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(options: SignatureRuntimeClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 120000;
    this.retries = options.retries ?? 2;
  }

  async health(): Promise<{ ok: boolean; service: string; outputDir: string }> {
    return this.fetchJson('/health', { method: 'GET' });
  }

  async listCompositions(): Promise<CompositionInfo[]> {
    const data = await this.fetchJson('/compositions', { method: 'GET' });
    return data.compositions;
  }

  async renderAsset(
    compositionId: string,
    input: Omit<RenderAssetRequest, 'compositionId'> = {},
  ): Promise<RenderAssetResponse> {
    return this.fetchJson('/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compositionId, ...input }),
    });
  }

  async renderSignature(
    input: RenderSignatureRequest,
  ): Promise<RenderSignatureResponse> {
    return this.renderAsset('signature', input);
  }

  private async fetchJson(path: string, init: RequestInit): Promise<any> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers: Record<string, string> = {
          ...(init.headers as Record<string, string>),
        };
        if (this.apiKey) {
          headers['X-Render-Key'] = this.apiKey;
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
          const message =
            data?.error ??
            `Render runtime request failed (${response.status})`;
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
      : new Error('Render runtime request failed');
  }
}
