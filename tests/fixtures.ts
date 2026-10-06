import type { ImageContent, SourceItem } from '@personal-context/core';

export const syntheticPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
export function imageItem(source = 'synthetic-provider', id = 'photo-1'): SourceItem<ImageContent> {
  return {
    id, source, type: 'image',
    content: { uri: 'https://example.test/photo.png', mimeType: 'image/png', sha256: 'a'.repeat(64), byteLength: 68 },
  };
}
