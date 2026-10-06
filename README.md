# Personal Context POC

Milestone 1 implements a local, source-independent ingestion pipeline:

```text
LocalPhotoSource → SourceItem → MockImageProcessor → Observation[] → PostgreSQL
```

The processor records verifiable image file metadata, with explicit mock labeling. It does not analyze scenes or infer personal facts. There are no external AI calls or Google integrations.

## Local setup

Requirements: Node.js 22+, pnpm 10.20.0 (pinned in `package.json`), and Docker with Compose. Run commands from the repository root.

If needed, use Corepack to invoke the pinned pnpm version (`corepack pnpm` in place of `pnpm`), or install `pnpm@10.20.0` with your preferred Node package manager.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d --wait
pnpm db:migrate
```

If your Docker installation provides the standalone binary, use `docker-compose` instead of `docker compose`. PostgreSQL 17 with pgvector binds to localhost port 5432. The migration enables the vector extension but creates no embeddings or vector columns. Database data persists in the Compose volume.

Copy a few images into `sample-data/photos`, including subfolders, or generate three synthetic images:

```sh
pnpm demo:fixtures
```

After setup, **one ingestion command** discovers, processes, and persists the photos:

```sh
pnpm ingest
pnpm inspect
```

Expected ingestion output for the synthetic fixtures:

```json
{ "sourceItems": 3, "observations": 3 }
```

Run `pnpm ingest` again: it reports three processed items, while database totals remain three source items and three observations. `pnpm inspect` prints counts, normalized source items, and observations joined to their original source identity. It defaults to 50 rows per collection; use `pnpm inspect 100` to increase the limit (maximum 1000).

Optional commands:

```sh
pnpm ingest /absolute/path/to/another/photo-folder
pnpm db:studio
pnpm dev
```

The minimal Next.js landing page at http://localhost:3000 explains the workflow. The CLI and Drizzle Studio provide result inspection in this milestone; a context explorer is deferred. The page does not load private photos or database records.

Direct database inspection is also available:

```sh
docker compose exec postgres psql -U context -d personal_context -c 'SELECT s.source, s.source_id, o.type, o.confidence, o.processor, o.processor_version, o.extracted_at FROM observations o JOIN source_items s ON s.id = o.source_item_id;'
```

Stop PostgreSQL with `docker compose stop`. To remove containers while keeping data, use `docker compose down`. Removing the volume would erase the local database.

## Packages and boundaries

- `packages/core`: normalized source contracts, image content contract, Zod observation schema, ingestion orchestration, and persistence interface. No filesystem adapters, database drivers, or vendor SDKs.
- `packages/sources`: `LocalPhotoSource`, a filesystem adapter.
- `packages/processors`: `MockImageProcessor`, selected by `SourceItem.type === 'image'` regardless of provider.
- `packages/db`: Drizzle schema, generated migration, PostgreSQL persistence, and inspection queries.
- `scripts`: CLI composition and local environment loading.
- `apps/web`: minimal Next.js app.

Only `source_items` and `observations` are needed for this slice. Entities, signals, memories, embeddings, real vision providers, Google Photos, and the context API remain deferred. `PLAN.md` remains the architecture reference.

## Contracts and behavior

`SourceItem.id` is the adapter's identity; the database stores it as `source_id` and gives the row its own UUID. `(source, source_id)` is unique. Other adapters can reuse an ID without colliding. The local adapter hashes the canonical file URI, so the same file has a stable identity across reruns. Moving a file creates a new identity. Duplicate bytes at different paths remain separate evidence items.

Local discovery supports JPEG, PNG, GIF, WebP, and AVIF extensions, case-insensitively, and checks a recognized file signature. It does not fully decode images or extract EXIF. Nonimage files and symlinks are skipped. A missing folder, unreadable file, or unrecognized image signature fails ingestion. An empty folder reports zero items. Filesystem timestamps are not substituted for photo capture time; `occurredAt` remains absent.

Each image envelope includes URI, MIME type, SHA-256 checksum, byte length, and relative-path metadata. The mock produces one `image_file` observation at confidence 1 for those file properties. The extraction timestamp records the processing run; otherwise output is deterministic for identical content. Tests inject a clock for exact reproducibility.

Each observation includes source evidence, processor name/version, optional model identifier, extraction timestamp, confidence, and extraction metadata. Persistence verifies evidence against the item, stores provenance through the foreign key and processor columns, and allows source identity inspection through a join.

An item's upsert and replacement observations run in one transaction. Repeated and concurrent ingestion do not duplicate items or observations. Changed file bytes update the envelope and mock observations. This milestone deliberately reprocesses items; completed-analysis caching belongs to Milestone 2. Previously ingested files that disappear from disk are not deleted automatically. If a later item fails, earlier successful items remain stored; rerun after correcting the problem.

## Checks

```sh
pnpm typecheck
pnpm test
pnpm build
# Or all three:
pnpm check
```

The unit suite uses only synthetic fixtures and tests adapter behavior, content-type processor selection, observation provenance/validation, and ingestion failures.

With PostgreSQL running, explicitly opt into the integration test:

```sh
TEST_DATABASE_URL=postgresql://context:context@127.0.0.1:5432/personal_context pnpm test:integration
```

Use a disposable local database for this test. It applies migrations, checks pgvector, runs three synthetic photos end to end, verifies idempotence and evidence, tests transaction rollback and concurrent reruns, and deletes only its uniquely namespaced records afterward. With no `TEST_DATABASE_URL`, the integration test is skipped. It does not silently use your normal `DATABASE_URL`.

To generate a migration after an intentional schema change:

```sh
pnpm db:generate
pnpm db:migrate
```

Schema and migration setup follow the [Drizzle migration workflow](https://orm.drizzle.team/docs/migrations); the app follows [Next.js manual installation](https://nextjs.org/docs/app/getting-started/installation).

## Local-data rules

`.env`, local env variants, `data/`, build output, and everything under `sample-data/photos` except `.gitkeep` are ignored. Synthetic demo files are generated locally and are also ignored. Do not commit personal photos, raw exports, tokens, keys, or extracted private context. Inspection output contains local paths and source content; treat it as private data.
