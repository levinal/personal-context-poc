import { imageContentSchema, type Observation, type SourceItem, type SourceProcessor } from '@personal-context/core';

export class MockImageProcessor implements SourceProcessor {
  constructor(private readonly now: () => Date = () => new Date()) {}

  supports(item: SourceItem): boolean {
    return item.type === 'image';
  }

  async process(item: SourceItem): Promise<Observation[]> {
    if (!this.supports(item)) throw new Error(`Unsupported content type: ${item.type}`);
    const content = imageContentSchema.parse(item.content);
    return [{
      type: 'image_file',
      subject: `source-item:${item.source}:${item.id}`,
      object: content.mimeType,
      confidence: 1,
      evidence: { source: item.source, sourceItemId: item.id },
      processor: { name: 'mock-image-processor', version: '1.0.0' },
      extractedAt: this.now(),
      metadata: { mock: true, sha256: content.sha256, byteLength: content.byteLength },
    }];
  }
}
