# Personal Context POC — Implementation Plan

## Goal

Build a local-first proof of concept for a **Personal Context Service**: a system that ingests personal data from pluggable sources, converts source data into normalized observations, and later derives evidence-backed personal context that AI agents can retrieve.

The first source will be a **local folder of photos**. Google Photos will be the second adapter.

The POC should prove the architecture before adding production integrations.

## Core design principle

Data sources are adapters. The Personal Context Engine must not depend on Google Photos, Instagram, LinkedIn, Gmail, or any other specific provider.

```text
Source adapters
    |
    v
SourceItem
    |
    v
Content processors
    |
    v
Observation[]
    |
    v
Entities / Signals / Memories
    |
    v
Personal Context Service
    |
    v
Context API
```

## POC scope

### In scope

- TypeScript
- Local development
- Source-independent ingestion contracts
- LocalPhotoSource
- ImageProcessor abstraction
- PostgreSQL
- pgvector
- Structured observations
- Evidence/provenance
- AI provider abstractions
- Google Photos adapter after the local pipeline works
- Context exploration/query API later in the POC

### Explicitly out of scope initially

- WhatsApp/message automation
- Automatic sending on behalf of the user
- Multiple production data sources
- Kubernetes
- Kafka
- Redis
- Dedicated graph database
- Microservices
- Complex authentication/authorization
- Production deployment
- Large-scale photo processing

## Proposed stack

- Node.js 22+
- TypeScript
- Next.js
- PostgreSQL 17
- pgvector
- Docker Compose
- Drizzle ORM
- Zod
- pnpm workspaces
- Pluggable AI provider interfaces

Keep infrastructure minimal. PostgreSQL should initially handle relational data, graph-like relationships, and vectors.

## Repository structure

```text
personal-context-poc/
├── apps/
│   └── web/
├── packages/
│   ├── core/
│   │   ├── sources/
│   │   ├── observations/
│   │   ├── entities/
│   │   ├── signals/
│   │   └── memories/
│   ├── sources/
│   │   ├── local-photos/
│   │   └── google-photos/
│   ├── processors/
│   │   └── images/
│   ├── ai/
│   ├── context/
│   ├── db/
│   └── shared/
├── sample-data/
│   └── photos/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── PLAN.md
```

The exact structure may evolve, but source-specific code must remain outside the context core.

## Core contracts

### SourceItem

Every source converts its provider-specific representation into a normalized envelope.

```ts
export interface SourceItem<T = unknown> {
  id: string;
  source: string;
  type: string;
  occurredAt?: Date;
  content: T;
  metadata?: Record<string, unknown>;
}
```

Do not force all provider data into a single rigid content schema. The envelope is normalized; content may remain typed by source/content type.

### ContextSource

```ts
export interface ContextSource<T = unknown> {
  readonly type: string;

  connect?(): Promise<void>;

  import(): AsyncIterable<SourceItem<T>>;
}
```

### SourceProcessor

Processing should primarily be based on content type rather than provider.

```ts
export interface SourceProcessor {
  supports(item: SourceItem): boolean;
  process(item: SourceItem): Promise<Observation[]>;
}
```

Examples:

- ImageProcessor
- TextProcessor
- MessageProcessor
- CalendarEventProcessor
- DocumentProcessor

This lets Google Photos and Instagram both reuse image processing while LinkedIn and Facebook can reuse text processing.

## Observation model

An observation is evidence derived from a source item. It is **not automatically a durable fact about the user**.

Example:

```json
{
  "type": "associated_location",
  "subject": "source-item:photo-123",
  "object": "entity:paris",
  "confidence": 0.94,
  "evidence": {
    "sourceItemId": "photo-123"
  }
}
```

Important distinction:

```text
Photo appears to be in Paris
    = observation

User likes Paris
    != observation

Repeated evidence may later support:
User has experience with Paris
    = derived signal/context
```

## Provenance requirement

Every derived observation, signal, or memory must remain traceable to its evidence.

Do not create important personal claims without provenance.

At minimum track:

- source
- source item ID
- processor/model
- timestamp
- confidence
- extraction metadata

## AI abstractions

External AI APIs must be behind interfaces.

Do not scatter vendor SDK calls throughout domain code.

Example:

```ts
export interface VisionAnalyzer {
  analyze(image: ImageInput): Promise<ImageAnalysis>;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

export interface LanguageModel {
  generate<T>(request: GenerationRequest): Promise<T>;
}
```

Initial implementations may use one provider, but core packages must not depend directly on that vendor SDK.

## Data model — initial

Start small.

### source_items

- id
- source
- source_id
- type
- occurred_at
- content
- metadata
- created_at

### observations

- id
- source_item_id
- type
- subject
- object
- confidence
- metadata
- created_at

### entities

- id
- canonical_name
- entity_type
- metadata
- created_at
- updated_at

Later milestones may add:

- entity_aliases
- signals
- memories
- relationships
- embeddings
- relationship_evidence

Do not implement the full future schema during Milestone 1 unless it is required.

# Milestones

## Milestone 1 — Source-independent foundation

### Objective

Prove:

```text
LocalPhotoSource
      |
      v
SourceItem
      |
      v
ImageProcessor
      |
      v
Observation[]
      |
      v
PostgreSQL
```

No Google integration is required yet.

### Tasks

1. Initialize pnpm workspace.
2. Create TypeScript configuration.
3. Create minimal Next.js app.
4. Add Docker Compose with PostgreSQL + pgvector.
5. Configure Drizzle.
6. Add initial database migrations.
7. Implement SourceItem.
8. Implement ContextSource.
9. Implement SourceProcessor.
10. Implement Observation model/schema.
11. Implement LocalPhotoSource.
12. Read images from `sample-data/photos`.
13. Convert local photos into SourceItems.
14. Implement a deterministic/mock ImageProcessor first.
15. Persist source items and observations.
16. Add a simple CLI or dev endpoint to trigger ingestion.
17. Add tests for the source and processor contracts.
18. Document local setup.

### Acceptance criteria

Running one command against several sample photos should:

1. Discover local photos.
2. Produce SourceItems.
3. Process them.
4. Produce observations.
5. Persist the source items and observations in PostgreSQL.
6. Allow inspecting the persisted results.

The pipeline must contain no Google-specific assumptions.

## Milestone 2 — Real image understanding

### Objective

Replace/mock-augment the deterministic processor with real vision analysis.

### Tasks

1. Implement VisionAnalyzer interface.
2. Add one vision provider implementation.
3. Define ImageAnalysis Zod schema.
4. Extract structured information such as:
   - scene
   - objects
   - activities
   - location candidates
   - topics
5. Convert ImageAnalysis into Observation[].
6. Store model/version metadata.
7. Add retries/error handling.
8. Cache completed analyses so the same image is not unnecessarily reprocessed.

### Rule

The vision model should produce observations about image content, not unsupported personality claims.

Bad:

```text
User loves Japan.
```

Good:

```text
Image likely depicts Tokyo.
Image depicts travel activity.
Image contains Japanese signage.
```

## Milestone 3 — Google Photos adapter

### Objective

Add Google Photos as another ContextSource without changing downstream processing.

Target:

```text
GooglePhotosSource ----┐
                      +--> SourceItem --> ImageProcessor --> Observation[]
LocalPhotoSource ------┘
```

### Tasks

1. Configure Google OAuth.
2. Integrate the Google Photos Picker API.
3. Allow the user to select a small batch of photos.
4. Convert selected media into SourceItems.
5. Process them through the existing ImageProcessor.
6. Persist provider metadata/provenance.
7. Confirm that core/processor code required no Google-specific modifications.

Do not design the POC around unrestricted enumeration of the user's entire Google Photos library. Use the supported user-selection flow.

## Milestone 4 — Entities and signals

### Objective

Start turning observations into personal context.

Example:

```text
Many travel-related observations
        |
        v
Signal: travel interest

Repeated Tokyo/Japan observations
        |
        v
Signal: experience with Japan
```

### Tasks

1. Implement entity model.
2. Implement basic entity resolution.
3. Add signal model.
4. Aggregate observations into signals.
5. Track:
   - strength
   - confidence
   - evidence count
   - first seen
   - last seen
6. Keep evidence links from signals back to observations/source items.

Do not treat a single weak observation as a strong user fact.

## Milestone 5 — Embeddings and retrieval

### Objective

Retrieve relevant evidence/context semantically.

### Tasks

1. Enable pgvector.
2. Implement EmbeddingProvider.
3. Generate embeddings for useful textual representations of observations/context.
4. Implement semantic retrieval.
5. Support queries such as:
   - "Find evidence related to Japan."
   - "What evidence suggests an interest in travel?"

## Milestone 6 — Personal Context explorer

### Objective

Make the inferred representation inspectable.

UI should show:

- inferred signals/context
- confidence
- strength
- evidence count
- supporting photos/observations
- first/last evidence
- why the system inferred it

Eventually support:

- Confirm
- Correct
- Remove
- Mark outdated

User corrections should outrank inferred context.

## Milestone 7 — Context API

### Objective

Expose task-specific context retrieval.

Example:

```http
POST /api/context/query
```

```json
{
  "query": "What do you know about my travel interests?"
}
```

Response should include both synthesized context and evidence.

The Context API should retrieve relevant information rather than dumping the entire personal database into an LLM prompt.

# Privacy and local-data rules

This repository deals with personal data.

Never commit:

- real personal photos
- Google OAuth tokens
- API keys
- downloaded Google Photos
- raw personal exports
- generated personal embeddings
- extracted private context

Add these to .gitignore from the beginning:

```text
.env
.env.local
data/
sample-data/photos/*
!sample-data/photos/.gitkeep
```

Use synthetic/test fixtures in automated tests.

# Engineering principles

1. Prefer a working vertical slice over speculative infrastructure.
2. Keep source adapters separate from the context engine.
3. Process by content type where possible, not by provider.
4. Separate observations from inferred personal facts.
5. Preserve evidence/provenance.
6. Keep confidence explicit.
7. Make personal context temporal where relevant.
8. Keep AI vendors behind interfaces.
9. Make ingestion idempotent.
10. Make analysis reproducible/debuggable.
11. Avoid infrastructure that is unnecessary for the POC.
12. Add abstractions only when they establish a meaningful boundary.

# First Codex implementation task

Implement **Milestone 1 only**.

Do not implement Google Photos, a real vision API, embeddings, signals, memories, or the context chat API yet.

The first successful demo should be:

```text
sample-data/photos/*.jpg
          |
          v
   LocalPhotoSource
          |
          v
      SourceItem
          |
          v
 MockImageProcessor
          |
          v
     Observation[]
          |
          v
 PostgreSQL + inspectable output
```

When Milestone 1 is complete, stop and evaluate the contracts and database shape before proceeding to Milestone 2.
