import { z } from 'zod';

export interface SourceItem<T = unknown> {
  id: string;
  source: string;
  type: string;
  occurredAt?: Date;
  content: T;
  metadata?: Record<string, unknown>;
}

export interface ContextSource<T = unknown> {
  readonly type: string;
  connect?(): Promise<void>;
  import(): AsyncIterable<SourceItem<T>>;
}

export interface SourceProcessor {
  supports(item: SourceItem): boolean;
  process(item: SourceItem): Promise<Observation[]>;
}

// Shared image content contract, independent of the provider supplying it.
export const imageContentSchema = z.object({
  uri: z.string().url(),
  mimeType: z.string().startsWith('image/'),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  byteLength: z.number().int().positive(),
});
export type ImageContent = z.infer<typeof imageContentSchema>;

export const observationSchema = z.object({
  type: z.string().min(1),
  subject: z.string().min(1),
  object: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.object({ source: z.string().min(1), sourceItemId: z.string().min(1) }),
  processor: z.object({ name: z.string().min(1), version: z.string().min(1), model: z.string().min(1).optional() }),
  extractedAt: z.date(),
  metadata: z.record(z.string(), z.unknown()),
});
export type Observation = z.infer<typeof observationSchema>;

export interface IngestionStore {
  // Must atomically replace this item's observations and upsert its source envelope.
  save(item: SourceItem, observations: Observation[]): Promise<void>;
}

export interface IngestionResult {
  sourceItems: number;
  observations: number;
}

export async function ingest(
  source: ContextSource,
  processors: readonly SourceProcessor[],
  store: IngestionStore,
): Promise<IngestionResult> {
  await source.connect?.();
  const result: IngestionResult = { sourceItems: 0, observations: 0 };
  for await (const item of source.import()) {
    const matching = processors.filter((processor) => processor.supports(item));
    if (matching.length !== 1) {
      throw new Error(`Expected one processor for content type ${item.type}; found ${matching.length}`);
    }
    const observations = (await matching[0]!.process(item)).map((value) => observationSchema.parse(value));
    for (const observation of observations) {
      if (observation.evidence.source !== item.source || observation.evidence.sourceItemId !== item.id) {
        throw new Error('Observation evidence does not match its source item');
      }
    }
    await store.save(item, observations);
    result.sourceItems += 1;
    result.observations += observations.length;
  }
  return result;
}
