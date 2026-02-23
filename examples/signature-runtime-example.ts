import { SignatureRuntimeClient } from '../src/integrations/signature-runtime-client';

async function main() {
  const baseUrl = process.env.SIGNATURE_RUNTIME_URL ?? 'http://127.0.0.1:3210';
  const client = new SignatureRuntimeClient({
    baseUrl,
    apiKey: process.env.RENDER_API_KEY,
    timeoutMs: 180000,
    retries: 2,
  });

  const health = await client.health();
  console.log('Signature runtime health:', health);

  // List available compositions
  const compositions = await client.listCompositions();
  console.log('Available compositions:', compositions.map((c) => c.id));

  // Render via convenience method
  const result = await client.renderSignature({
    format: 'png',
    durationInFrames: 120,
    props: {
      signatureColor: '#ffffff',
      background: 'radial-gradient(circle at 20% 20%, #1c2d44 0%, #0b1118 60%)',
    },
  });

  console.log('Render created:');
  console.log('  id:', result.id);
  console.log('  compositionId:', result.compositionId);
  console.log('  format:', result.format);
  console.log('  url:', result.url);
}

main().catch((error) => {
  console.error('Signature runtime example failed:', error);
  process.exit(1);
});
