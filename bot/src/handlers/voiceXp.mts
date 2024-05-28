/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { Guild, GuildMember, Snowflake } from "discord.js"
import { handler } from "../models/handler.mjs"
import { Drizzle } from "../clients.mjs"
import { rewardsTable, xpTable } from "../schema.mjs"
import { and, eq, sql } from "drizzle-orm"
import { levelForTotalXp, totalXpForLevel } from "../util/xp.mjs"
import { XpConfigs } from "./loadConfigOnReady.mjs"
import { randomInt } from "crypto"
import { levelUpMessage } from "../messages/levelUp.mjs"

const guilds = new Map<Snowflake, Map<Snowflake, NodeJS.Timeout | undefined>>()

export async function updateFromCache(guild: Guild) {
  let members = guilds.get(guild.id)
  if (!members) {
    members = new Map()
    guilds.set(guild.id, members)
  }

  for (const state of guild.voiceStates.cache.values()) {
    if (
      !state.member ||
      !state.channelId ||
      state.channelId === guild.afkChannelId
    ) {
      continue
    }

    await setMember(members, { member: state.member })
  }
}

export async function updateIntervals(guild: Guild) {
  const members = guilds.get(guild.id)
  if (!members) {
    return
  }

  for (const userId of members.keys()) {
    await setMember(members, { userId, guild })
  }
}

export const VoiceXp = handler({
  event: "voiceStateUpdate",
  once: false,
  async handle(_, { member, channel }) {
    if (!member || member.user.bot) {
      return
    }

    let members = guilds.get(member.guild.id)
    if (!members) {
      members = new Map()
      guilds.set(member.guild.id, members)
    }

    if (!channel || channel.id === channel.guild.afkChannelId) {
      clearInterval(members.get(member.id))
      members.delete(member.id)
      return
    }

    await setMember(members, { member })
  },
})

async function setMember(
  members: Map<Snowflake, NodeJS.Timeout | undefined>,
  options: { member: GuildMember } | { userId: Snowflake; guild: Guild },
) {
  const member =
    "member" in options
      ? options.member
      : await options.guild.members.fetch(options.userId)
  const guild = member.guild
  const config = XpConfigs.get(guild.id)

  clearInterval(members.get(member.id))
  if (!config?.voiceCooldown || !config?.voiceGain) {
    members.set(member.id, undefined)
    return
  }

  const callback = callbackFactory(member, config.voiceGain, config.voiceRange)
  members.set(
    member.id,
    setInterval(
      () => void callback().catch(console.error),
      config.voiceCooldown * 1000,
    ),
  )
}

function callbackFactory(
  member: GuildMember,
  gain: number,
  range: number | null,
) {
  return async function callback() {
    let randomGain = gain
    if (range) {
      randomGain += randomInt(range * 2 + 1) - range
    }

    const [user] = await Drizzle.insert(xpTable)
      .values({ userId: member.id, guildId: member.guild.id, xp: randomGain })
      .onConflictDoUpdate({
        target: [xpTable.userId, xpTable.guildId],
        set: { xp: sql`${xpTable.xp} + ${randomGain}` },
      })
      .returning()

    if (!user) {
      return
    }

    const level = levelForTotalXp(user.xp)
    if (user.xp - randomGain >= totalXpForLevel(level)) {
      return
    }

    const rewards = await Drizzle.select()
      .from(rewardsTable)
      .where(
        and(
          eq(rewardsTable.guildId, member.guild.id),
          eq(rewardsTable.level, level),
        ),
      )

    await member.roles.add(rewards.map((reward) => reward.roleId))

    if (!member.voice.channel) {
      return
    }

    await member.voice.channel.send(
      levelUpMessage(
        member,
        level,
        rewards.map(({ roleId }) => roleId),
        true,
      ),
    )
  }
}
