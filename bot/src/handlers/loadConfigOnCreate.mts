/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { eq, desc } from "drizzle-orm"
import { Drizzle } from "../clients.mjs"
import { handler } from "../models/handler.mjs"
import { settingsTable } from "../schema.mjs"
import { XpConfigs } from "./loadConfigOnReady.mjs"
import { updateFromCache } from "./voiceXp.mjs"

export const LoadConfigOnCreate = handler({
  event: "guildCreate",
  once: false,
  async handle(guild) {
    if (!XpConfigs.has(guild.id)) {
      const [config] = await Drizzle.select()
        .from(settingsTable)
        .where(eq(settingsTable.guildId, guild.id))
        .orderBy(desc(settingsTable.id))
        .limit(1)

      if (config) {
        XpConfigs.set(guild.id, config)
      }
    }

    await updateFromCache(guild)
  },
})
