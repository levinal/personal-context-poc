import { describe, expect, it } from 'vitest';
import { observationSchema } from '@personal-context/core';
import { MockImageProcessor } from '@personal-context/processors';
import { imageItem } from './fixtures.js';

const extractedAt = new Date('2026-01-01T00:00:00Z');
describe('MockImageProcessor', () => {
  it('selects by content type regardless of provider', async () => {
    const processor = new MockImageProcessor(() => extractedAt);
    for (const source of ['local-photos', 'unrelated-image-provider']) {
      const item = imageItem(source);
      expect(processor.supports(item)).toBe(true);
      const values = await processor.process(item);
      expect(values).toHaveLength(1);
      expect(observationSchema.parse(values[0])).toMatchObject({
        type: 'image_file', object: 'image/png', confidence: 1,
        evidence: { source, sourceItemId: item.id },
        processor: { name: 'mock-image-processor', version: '1.0.0' },
        extractedAt, metadata: { mock: true, sha256: item.content.sha256, byteLength: 68 },
      });
      expect(await processor.process(item)).toEqual(values);
    }
  });

  it('declines nonimages and rejects invalid image payloads', async () => {
    const processor = new MockImageProcessor();
    const nonimage = { ...imageItem(), type: 'text' };
    expect(processor.supports(nonimage)).toBe(false);
    await expect(processor.process(nonimage)).rejects.toThrow('Unsupported content type');
    await expect(processor.process({ ...imageItem(), content: {} })).rejects.toThrow();
  });

  it('requires complete provenance and bounded confidence', async () => {
    const [value] = await new MockImageProcessor().process(imageItem());
    expect(observationSchema.safeParse({ ...value, confidence: 1.1 }).success).toBe(false);
    expect(observationSchema.safeParse({ ...value, evidence: {} }).success).toBe(false);
    expect(observationSchema.safeParse({ ...value, processor: { name: 'mock' } }).success).toBe(false);
  });
});
