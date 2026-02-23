import { SignatureRuntimeClient } from '../src/integrations/signature-runtime-client';

async function main() {
  const baseUrl = process.env.SIGNATURE_RUNTIME_URL ?? 'http://127.0.0.1:3210';
  const client = new SignatureRuntimeClient({
    baseUrl,
    apiKey: process.env.RENDER_API_KEY,
    timeoutMs: 180000,
  });

  // Render a stamp-seal via the generic renderAsset method
  const result = await client.renderAsset('stamp-seal', {
    format: 'png',
    props: {
      sealColor: '#c0392b',
      sealText: 'APPROVED',
      background: '#1a0505',
    },
  });

  console.log('Stamp seal rendered:');
  console.log('  id:', result.id);
  console.log('  compositionId:', result.compositionId);
  console.log('  format:', result.format);
  console.log('  dimensions:', `${result.width}x${result.height}`);
  console.log('  url:', result.url);

  // Render as MP4 video
  const video = await client.renderAsset('stamp-seal', {
    format: 'mp4',
    props: {
      sealColor: '#2c3e50',
      sealText: 'CERTIFIED',
      background: '#0a0a1a',
    },
  });

  console.log('\nStamp seal video:');
  console.log('  id:', video.id);
  console.log('  format:', video.format);
  console.log('  url:', video.url);
}

main().catch((error) => {
  console.error('Stamp seal example failed:', error);
  process.exit(1);
});
