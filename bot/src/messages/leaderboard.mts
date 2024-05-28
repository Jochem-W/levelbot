/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Guild,
  MessageActionRowComponentBuilder,
  Snowflake,
  User,
  bold,
  inlineCode,
  userMention,
} from "discord.js"
import { xpTable } from "../schema.mjs"
import { component } from "../models/component.mjs"
import { Drizzle } from "../clients.mjs"
import { and, asc, eq } from "drizzle-orm"
import { userPositionFactory } from "../util/db.mjs"
import { levelForTotalXp, totalXpForLevel, xpForLevelUp } from "../util/xp.mjs"

const fetchCount = 1

function addLevel<T>(data: T & { xp: number }) {
  return { ...data, level: levelForTotalXp(data.xp) }
}

function rankLine({
  position,
  userId,
  level,
  xp,
}: {
  position: string
  userId: Snowflake
  level: number
  xp: number
}) {
  return `${inlineCode(
    `#${parseInt(position).toLocaleString("en")}`,
  )} - ${userMention(userId)} - Level ${bold(level.toString())} (${(
    xp - totalXpForLevel(level)
  ).toLocaleString("en")}/${xpForLevelUp(level).toLocaleString("en")} XP)`
}

export async function leaderboardMessage(
  guild: Guild,
  user: User,
  page: number,
) {
  const userPosition = userPositionFactory(guild)
  const data = await Drizzle.select({
    userId: xpTable.userId,
    xp: xpTable.xp,
    position: userPosition.position,
  })
    .from(xpTable)
    .where(eq(xpTable.guildId, guild.id))
    .innerJoin(userPosition, eq(userPosition.userId, xpTable.userId))
    .orderBy(asc(userPosition.position))
    .offset(page * fetchCount)
    .limit(fetchCount + 1)

  const embed = new EmbedBuilder()
    .setTitle("Leaderboard")
    .setDescription(
      data.slice(0, fetchCount).map(addLevel).map(rankLine).join("\n") ||
        "The leaderboard is currently empty.",
    )
    .setTimestamp(Date.now())

  const [self] = await Drizzle.select({
    userId: xpTable.userId,
    xp: xpTable.xp,
    position: userPosition.position,
  })
    .from(xpTable)
    .where(and(eq(xpTable.guildId, guild.id), eq(xpTable.userId, user.id)))
    .innerJoin(userPosition, eq(userPosition.userId, xpTable.userId))

  if (self) {
    embed.addFields({
      name: "Your rank",
      value: rankLine(addLevel(self)),
    })
  }

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setEmoji("⬅️")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0)
          .setCustomId(paginationButton(user.id, (page - 1).toString())),
        new ButtonBuilder()
          .setEmoji("🏠")
          .setLabel("Start")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0)
          .setCustomId(paginationButton(user.id, "")),
        new ButtonBuilder()
          .setEmoji("➡️")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(data.length < fetchCount + 1)
          .setCustomId(paginationButton(user.id, (page + 1).toString())),
      ),
    ],
  }
}

const paginationButton = component({
  type: ComponentType.Button,
  name: "leadboard",
  async handle(interaction, userId, valueStr) {
    if (interaction.user.id !== userId || !interaction.inCachedGuild()) {
      return
    }

    const value = valueStr === "" ? 0 : parseInt(valueStr, 10)

    await interaction.update(
      await leaderboardMessage(interaction.guild, interaction.user, value),
    )
  },
})
