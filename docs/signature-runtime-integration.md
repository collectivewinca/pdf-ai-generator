# Signature Runtime Integration (`skills/pdf-generator`)

Use `ve-animesign-pdf` as a runtime dependency to generate signature assets
that can be embedded into PDFs.

## 1) Start signature runtime

Default URL:

`http://127.0.0.1:3210`

## 2) Use the client in pdf-generator flow

```ts
import { SignatureRuntimeClient } from '../src/integrations/signature-runtime-client';

const signatureClient = new SignatureRuntimeClient({
  baseUrl: process.env.SIGNATURE_RUNTIME_URL ?? 'http://127.0.0.1:3210',
  timeoutMs: 180000,
  retries: 2,
});

const signature = await signatureClient.renderSignature({
  format: 'png',
  width: 1577,
  height: 608,
  durationInFrames: 120,
  props: {
    signatureColor: '#ffffff',
  },
});

// Use signature.url (HTTP) or signature.path (local path on runtime host)
console.log(signature.url);
```

## 3) Quick test

```bash
npm run example:signature-runtime
```
