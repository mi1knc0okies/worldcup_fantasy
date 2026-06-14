import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const friends = sqliteTable("friends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const picks = sqliteTable("picks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
