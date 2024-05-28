/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { Guild } from "discord.js"
import { sql, desc, asc, eq } from "drizzle-orm"
import { Drizzle } from "../clients.mjs"
import { xpTable } from "../schema.mjs"

export function userPositionFactory(guild: Guild) {
  return Drizzle.select({
    userId: xpTable.userId,
    position: sql<string>`row_number() OVER (ORDER BY ${desc(
      xpTable.xp,
    )}, ${asc(xpTable.userId)})`.as("position"),
  })
    .from(xpTable)
    .where(eq(xpTable.guildId, guild.id))
    .as("userPosition")
}
