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
  roleMention,
} from "discord.js"
import { rewardsTable } from "../schema.mjs"
import { component } from "../models/component.mjs"
import { Drizzle } from "../clients.mjs"
import { eq, asc, and, gte, lt, desc } from "drizzle-orm"

export async function roleRewardsMessage(
  guild: Guild,
  query: { beforeExclusive: number } | { afterInclusive: number },
) {
  const rewards = await Drizzle.select()
    .from(rewardsTable)
    .where(
      and(
        eq(rewardsTable.guildId, guild.id),
        "afterInclusive" in query
          ? gte(rewardsTable.level, query.afterInclusive)
          : lt(rewardsTable.level, query.beforeExclusive),
      ),
    )
    .orderBy(
      "afterInclusive" in query
        ? asc(rewardsTable.level)
        : desc(rewardsTable.level),
    )

  let atStart = true
  let atEnd = true
  if ("afterInclusive" in query) {
    const [before] = await Drizzle.select()
      .from(rewardsTable)
      .where(
        and(
          eq(rewardsTable.guildId, guild.id),
          lt(rewardsTable.level, query.afterInclusive),
        ),
      )
      .limit(1)
    atStart = before === undefined
  } else {
    const [after] = await Drizzle.select()
      .from(rewardsTable)
      .where(
        and(
          eq(rewardsTable.guildId, guild.id),
          gte(rewardsTable.level, query.beforeExclusive),
        ),
      )
      .limit(1)
    atEnd = after === undefined
  }

  const embed = new EmbedBuilder().setTitle("Role rewards")

  let firstLevel = Infinity
  let lastLevel = -Infinity

  let current = []
  for (const reward of rewards) {
    if (!current[0] || current[0].level === reward.level) {
      current.push(reward)
      continue
    }

    lastLevel = Math.max(lastLevel, current[0].level)
    firstLevel = Math.min(firstLevel, current[0].level)

    embed.addFields({
      name: `Level ${current[0].level}`,
      value: current.map((r) => `- ${roleMention(r.roleId)}`).join("\n"),
      inline: true,
    })

    current = []
    if (embed.data.fields?.length === 25) {
      if ("afterInclusive" in query) {
        atEnd = false
      } else {
        atStart = false
      }
      break
    }

    current.push(reward)
  }

  if (current[0]) {
    embed.addFields({
      name: `Level ${current[0].level}`,
      value: current.map((r) => `- ${roleMention(r.roleId)}`).join("\n"),
      inline: true,
    })
    lastLevel = Math.max(lastLevel, current[0].level)
    firstLevel = Math.min(firstLevel, current[0].level)
  }

  if ("beforeExclusive" in query) {
    embed.data.fields?.reverse()
  }

  if (!embed.data.fields || embed.data.fields.length === 0) {
    embed.setDescription("No role rewards have been set.")
  }

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setEmoji("⬅️")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(atStart)
          .setCustomId(paginationButton("b", firstLevel.toString())),
        new ButtonBuilder()
          .setEmoji("🏠")
          .setLabel("Start")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(atStart)
          .setCustomId(paginationButton("a", "0")),
        new ButtonBuilder()
          .setEmoji("➡️")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(atEnd)
          .setCustomId(paginationButton("a", (lastLevel + 1).toString())),
      ),
    ],
    ephemeral: true,
  }
}

const paginationButton = component({
  type: ComponentType.Button,
  name: "rewards-list",
  async handle(interaction, mode, valueStr) {
    if (!interaction.inCachedGuild()) {
      return
    }

    const value = parseInt(valueStr, 10)

    await interaction.update(
      await roleRewardsMessage(
        interaction.guild,
        mode === "a" ? { afterInclusive: value } : { beforeExclusive: value },
      ),
    )
  },
})
