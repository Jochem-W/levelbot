/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { desc, eq } from "drizzle-orm"
import { Drizzle } from "../clients.mjs"
import { handler } from "../models/handler.mjs"
import { settingsTable } from "../schema.mjs"
import { Snowflake } from "discord.js"
import { updateFromCache } from "./voiceXp.mjs"

export const XpConfigs = new Map<Snowflake, typeof settingsTable.$inferSelect>()

export const LoadConfigOnReady = handler({
  event: "ready",
  once: true,
  async handle(client) {
    for (const guildId of client.guilds.cache.keys()) {
      const [config] = await Drizzle.select()
        .from(settingsTable)
        .where(eq(settingsTable.guildId, guildId))
        .orderBy(desc(settingsTable.id))
        .limit(1)

      if (!config) {
        continue
      }

      XpConfigs.set(guildId, config)
    }

    for (const guild of client.guilds.cache.values()) {
      await updateFromCache(guild)
    }
  },
})
