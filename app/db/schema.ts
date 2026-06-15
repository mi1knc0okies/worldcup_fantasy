import { relations } from "drizzle-orm";
import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const picks = pgTable("picks", {
  id: serial("id").primaryKey(),
  friendId: integer("friend_id")
    .notNull()
    .references(() => friends.id, { onDelete: "cascade" }),
  // football-data.org team name, e.g. "Argentina"
  teamName: text("team_name").notNull(),
});

export const friendsRelations = relations(friends, ({ many }) => ({
  picks: many(picks),
}));

export const picksRelations = relations(picks, ({ one }) => ({
  friend: one(friends, { fields: [picks.friendId], references: [friends.id] }),
}));
