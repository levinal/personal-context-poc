import { mkdir, writeFile } from 'node:fs/promises';

// Synthetic 1x1 PNG. No personal images are included in the repository.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
await mkdir('sample-data/photos', { recursive: true });
for (const name of ['synthetic-a.png', 'synthetic-b.png', 'synthetic-c.png']) {
  try {
    await writeFile(`sample-data/photos/${name}`, png, { flag: 'wx' });
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
  }
}
console.log('Synthetic demo photos are available in sample-data/photos (ignored by Git).');
