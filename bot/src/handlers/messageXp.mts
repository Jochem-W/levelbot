/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { Snowflake } from "discord.js"
import { handler } from "../models/handler.mjs"
import { Drizzle } from "../clients.mjs"
import { rewardsTable, xpTable } from "../schema.mjs"
import { and, eq, sql } from "drizzle-orm"
import { levelForTotalXp, totalXpForLevel } from "../util/xp.mjs"
import { XpConfigs } from "./loadConfigOnReady.mjs"
import { randomInt } from "crypto"
import { levelUpMessage } from "../messages/levelUp.mjs"

const guilds = new Map<Snowflake, Set<Snowflake>>()

export const MessageXp = handler({
  event: "messageCreate",
  once: false,
  async handle(message) {
    if (message.author.bot || !message.inGuild() || !message.member) {
      return
    }

    let members = guilds.get(message.guild.id)
    if (!members) {
      members = new Set()
      guilds.set(message.guild.id, members)
    }

    const xpConfig = XpConfigs.get(message.guild.id)
    if (!xpConfig?.messageGain) {
      return
    }

    if (members.has(message.author.id)) {
      return
    }

    if (xpConfig.messageCooldown) {
      members.add(message.author.id)
      setTimeout(
        () => members.delete(message.author.id),
        xpConfig.messageCooldown * 1000,
      )
    }

    let gain = xpConfig.messageGain
    if (xpConfig.messageRange) {
      gain += randomInt(2 * xpConfig.messageRange + 1) - xpConfig.messageRange
    }

    const [user] = await Drizzle.insert(xpTable)
      .values({
        userId: message.author.id,
        guildId: message.guild.id,
        xp: gain,
      })
      .onConflictDoUpdate({
        target: [xpTable.userId, xpTable.guildId],
        set: { xp: sql`${xpTable.xp} + ${gain}` },
      })
      .returning()

    if (!user) {
      return
    }

    const level = levelForTotalXp(user.xp)
    if (user.xp - gain >= totalXpForLevel(level)) {
      return
    }

    const rewards = await Drizzle.select()
      .from(rewardsTable)
      .where(
        and(
          eq(rewardsTable.guildId, message.guild.id),
          eq(rewardsTable.level, level),
        ),
      )

    await message.member.roles.add(rewards.map((reward) => reward.roleId))

    await message.reply(
      levelUpMessage(
        message.member,
        level,
        rewards.map(({ roleId }) => roleId),
      ),
    )
  },
})
