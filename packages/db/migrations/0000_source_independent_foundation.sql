CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_item_id" uuid NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"object" text NOT NULL,
	"confidence" real NOT NULL,
	"processor" text NOT NULL,
	"processor_version" text NOT NULL,
	"model" text,
	"extracted_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "observations_confidence_range" CHECK ("observations"."confidence" >= 0 AND "observations"."confidence" <= 1)
);
--> statement-breakpoint
CREATE TABLE "source_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone,
	"content" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_source_item_id_source_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observations_source_item_index" ON "observations" USING btree ("source_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_items_source_identity" ON "source_items" USING btree ("source","source_id");