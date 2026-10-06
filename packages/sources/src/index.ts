import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, readdir, realpath } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ContextSource, ImageContent, SourceItem } from '@personal-context/core';

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

function detectMimeType(header: Buffer): string | undefined {
  if (header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (['GIF87a', 'GIF89a'].includes(header.toString('ascii', 0, 6))) return 'image/gif';
  if (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (header.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(header.toString('ascii', 8))) return 'image/avif';
  return undefined;
}

async function* discover(directory: string): AsyncIterable<string> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const entry of entries) {
    const path = join(directory, entry.name);
    // Do not follow symlinks outside the selected folder or into recursive loops.
    if (entry.isDirectory()) yield* discover(path);
    else if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) yield path;
  }
}

export class LocalPhotoSource implements ContextSource<ImageContent> {
  readonly type = 'local-photos';

  constructor(private readonly directory: string) {}

  async *import(): AsyncIterable<SourceItem<ImageContent>> {
    const root = await realpath(resolve(this.directory));
    for await (const path of discover(root)) {
      const file = await open(path, 'r');
      let mimeType: string | undefined;
      try {
        const header = Buffer.alloc(64);
        const { bytesRead } = await file.read(header, 0, header.length, 0);
        mimeType = detectMimeType(header.subarray(0, bytesRead));
      } finally {
        await file.close();
      }
      if (!mimeType) throw new Error(`Unsupported image signature: ${relative(root, path)}`);
      const hash = createHash('sha256');
      let byteLength = 0;
      for await (const chunk of createReadStream(path)) {
        hash.update(chunk);
        byteLength += chunk.length;
      }
      const uri = pathToFileURL(path).href;
      yield {
        // Identity is the canonical file URI. A changed file retains identity but changes checksum.
        id: createHash('sha256').update(uri).digest('hex'),
        source: this.type,
        type: 'image',
        content: { uri, mimeType, sha256: hash.digest('hex'), byteLength },
        metadata: { relativePath: relative(root, path) },
        // File modification time is deliberately not treated as photo capture time.
      };
    }
  }
}
