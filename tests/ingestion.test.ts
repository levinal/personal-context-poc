import { describe, expect, it, vi } from 'vitest';
import { ingest, type ContextSource, type Observation, type SourceItem } from '@personal-context/core';
import { MockImageProcessor } from '@personal-context/processors';
import { imageItem } from './fixtures.js';

function source(items: SourceItem[]): ContextSource {
  return { type: 'test', connect: vi.fn(async () => {}), async *import() { yield* items; } };
}
describe('source-independent ingestion', () => {
  it('connects, processes, and saves normalized envelopes and evidence', async () => {
    const input = source([imageItem('adapter-a'), imageItem('adapter-b')]);
    const save = vi.fn(async (_item: SourceItem, _values: Observation[]) => {});
    expect(await ingest(input, [new MockImageProcessor()], { save })).toEqual({ sourceItems: 2, observations: 2 });
    expect(input.connect).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0]?.[1][0]?.evidence).toEqual({ source: 'adapter-a', sourceItemId: 'photo-1' });
  });

  it('fails before writing when processing or provenance is invalid', async () => {
    const item = imageItem();
    const values = await new MockImageProcessor().process(item);
    const save = vi.fn(async () => {});
    const processor = { supports: () => true, process: async () => values.map((value) => ({ ...value, evidence: { ...value.evidence, sourceItemId: 'wrong' } })) };
    await expect(ingest(source([item]), [processor], { save })).rejects.toThrow('evidence');
    expect(save).not.toHaveBeenCalled();
    await expect(ingest(source([{ ...item, content: {} }]), [new MockImageProcessor()], { save })).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects missing or ambiguous processors and propagates persistence failure', async () => {
    const input = source([imageItem()]);
    const save = vi.fn(async () => { throw new Error('Database unavailable'); });
    await expect(ingest(input, [], { save })).rejects.toThrow('found 0');
    await expect(ingest(input, [new MockImageProcessor(), new MockImageProcessor()], { save })).rejects.toThrow('found 2');
    await expect(ingest(input, [new MockImageProcessor()], { save })).rejects.toThrow('Database unavailable');
  });
});
