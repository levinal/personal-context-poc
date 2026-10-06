import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalPhotoSource } from '@personal-context/sources';
import { syntheticPng } from './fixtures.js';

const directories: string[] = [];
async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'context-source-'));
  directories.push(path);
  return path;
}
async function collect(source: LocalPhotoSource) {
  const items = [];
  for await (const item of source.import()) items.push(item);
  return items;
}
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

describe('LocalPhotoSource', () => {
  it('discovers recursively, normalizes images, and skips nonimages and symlinks', async () => {
    const root = await directory();
    await mkdir(join(root, 'nested'));
    await writeFile(join(root, 'a.PNG'), syntheticPng);
    await writeFile(join(root, 'nested', 'b.png'), syntheticPng);
    await writeFile(join(root, 'notes.txt'), 'not an image');
    await symlink(root, join(root, 'loop'));
    await symlink(join(root, 'a.PNG'), join(root, 'link.png'));
    const source = new LocalPhotoSource(root);
    const items = await collect(source);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ source: 'local-photos', type: 'image', metadata: { relativePath: 'a.PNG' } });
    expect(items[0]?.content).toMatchObject({ mimeType: 'image/png', byteLength: syntheticPng.length, sha256: createHash('sha256').update(syntheticPng).digest('hex') });
    expect(items[0]?.content.uri).toMatch(/^file:/);
    expect(items[0]?.occurredAt).toBeUndefined();
    expect(new Set(items.map((item) => item.id)).size).toBe(2);
    expect(await collect(source)).toEqual(items);
  });

  it('keeps identity stable when bytes change and distinguishes different roots', async () => {
    const root = await directory();
    const otherRoot = await directory();
    await writeFile(join(root, 'a.png'), syntheticPng);
    await writeFile(join(otherRoot, 'a.png'), syntheticPng);
    const before = (await collect(new LocalPhotoSource(root)))[0]!;
    const other = (await collect(new LocalPhotoSource(otherRoot)))[0]!;
    expect(before.id).not.toBe(other.id);
    await writeFile(join(root, 'a.png'), Buffer.concat([syntheticPng, Buffer.from('changed')]));
    const after = (await collect(new LocalPhotoSource(root)))[0]!;
    expect(after.id).toBe(before.id);
    expect(after.content.sha256).not.toBe(before.content.sha256);
  });

  it('supports a JPEG independently of its filename casing', async () => {
    const root = await directory();
    await writeFile(join(root, 'photo.JpG'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    expect((await collect(new LocalPhotoSource(root)))[0]?.content.mimeType).toBe('image/jpeg');
  });

  it('rejects files with an image extension but no recognized signature', async () => {
    const root = await directory();
    await writeFile(join(root, 'fake.jpg'), 'not a photo');
    await expect(collect(new LocalPhotoSource(root))).rejects.toThrow('Unsupported image signature');
  });

  it('returns no items for an empty folder and fails for a missing folder', async () => {
    const root = await directory();
    expect(await collect(new LocalPhotoSource(root))).toEqual([]);
    await expect(collect(new LocalPhotoSource(join(root, 'missing')))).rejects.toThrow();
  });
});
