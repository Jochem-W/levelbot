CREATE TABLE IF NOT EXISTS "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"role_id" text NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "rewards_role_id_unique" UNIQUE("role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"voice_gain" integer DEFAULT 0 NOT NULL,
	"voice_cooldown" integer DEFAULT 0 NOT NULL,
	"voice_range" integer DEFAULT 0 NOT NULL,
	"message_gain" integer DEFAULT 0 NOT NULL,
	"message_cooldown" integer DEFAULT 0 NOT NULL,
	"message_range" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "xp" (
	"user_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"xp" integer NOT NULL,
	CONSTRAINT "xp_user_id_guild_id_pk" PRIMARY KEY("user_id","guild_id")
);
