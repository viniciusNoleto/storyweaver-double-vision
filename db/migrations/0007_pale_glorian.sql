CREATE TABLE "tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" varchar(50) NOT NULL,
	"attribute" varchar(30) NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "origins" ADD COLUMN "tool_choice" jsonb;