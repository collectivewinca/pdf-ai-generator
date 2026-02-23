import {
  SignatureRuntimeClient,
  type RenderSignatureResponse,
} from '../src/integrations/signature-runtime-client';

async function main() {
  const baseUrl = process.env.SIGNATURE_RUNTIME_URL ?? 'http://127.0.0.1:3210';
  const client = new SignatureRuntimeClient({
    baseUrl,
    timeoutMs: 180000,
    retries: 2,
  });

  const health = await client.health();
  console.log('Signature runtime health:', health);

  const result: RenderSignatureResponse = await client.renderSignature({
    format: 'png',
    durationInFrames: 120,
    props: {
      signatureColor: '#ffffff',
      background: 'radial-gradient(circle at 20% 20%, #1c2d44 0%, #0b1118 60%)',
    },
  });

  console.log('Render created:');
  console.log('  id:', result.id);
  console.log('  format:', result.format);
  console.log('  url:', result.url);
  console.log('  path:', result.path);
}

main().catch((error) => {
  console.error('Signature runtime example failed:', error);
  process.exit(1);
});
