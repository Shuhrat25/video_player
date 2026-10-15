CREATE TABLE IF NOT EXISTS "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"number" integer NOT NULL,
	"name" varchar(255),
	"duration_seconds" integer,
	"poster_url" text,
	"opening_start" integer,
	"opening_end" integer,
	"ending_start" integer,
	"ending_end" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "related_titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_id" integer NOT NULL,
	"related_title_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_id" integer NOT NULL,
	"studio_id" integer,
	"number" integer NOT NULL,
	"name" varchar(120),
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"logo_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subtitles" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" integer NOT NULL,
	"language" varchar(40) NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"description" text,
	"poster_url_mobile" text,
	"poster_url_desktop" text,
	"year" integer,
	"author" varchar(255),
	"genres" text[],
	"total_episodes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" integer NOT NULL,
	"quality" varchar(10) NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_titles" ADD CONSTRAINT "related_titles_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_titles" ADD CONSTRAINT "related_titles_related_title_id_titles_id_fk" FOREIGN KEY ("related_title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seasons" ADD CONSTRAINT "seasons_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seasons" ADD CONSTRAINT "seasons_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subtitles" ADD CONSTRAINT "subtitles_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_sources" ADD CONSTRAINT "video_sources_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "episode_season_number_idx" ON "episodes" USING btree ("season_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "related_titles_pair_idx" ON "related_titles" USING btree ("title_id","related_title_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "season_title_number_idx" ON "seasons" USING btree ("title_id","number");