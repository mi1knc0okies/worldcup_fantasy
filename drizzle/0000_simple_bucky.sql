CREATE TABLE "friends" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"friend_id" integer NOT NULL,
	"team_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_friend_id_friends_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;