/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { integer, pgTable, text, serial, primaryKey } from "drizzle-orm/pg-core"

export const xpTable = pgTable(
  "xp",
  {
    userId: text("user_id").notNull(),
    guildId: text("guild_id").notNull(),
    xp: integer("xp").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.guildId] }),
  }),
)

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  voiceGain: integer("voice_gain").notNull().default(0),
  voiceCooldown: integer("voice_cooldown").notNull().default(0),
  voiceRange: integer("voice_range").notNull().default(0),
  messageGain: integer("message_gain").notNull().default(0),
  messageCooldown: integer("message_cooldown").notNull().default(0),
  messageRange: integer("message_range").notNull().default(0),
})

export const rewardsTable = pgTable("rewards", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  roleId: text("role_id").notNull().unique(),
  level: integer("level").notNull(),
})
