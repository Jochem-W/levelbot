/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { EmbedBuilder, PermissionFlagsBits, userMention } from "discord.js"
import { InstallationContext, InteractionContext } from "../models/command.mjs"
import { slashCommand, slashSubcommand } from "../models/slashCommand.mjs"
import { and, eq, sql } from "drizzle-orm"
import { Drizzle } from "../clients.mjs"
import { xpTable } from "../schema.mjs"
import { levelForTotalXp, totalXpForLevel } from "../util/xp.mjs"

export const ManageCommand = slashCommand({
  name: "manage",
  description: "Manage the XP and levels of user",
  nsfw: false,
  integrationTypes: [InstallationContext.GuildInstall],
  contexts: [InteractionContext.Guild],
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  subcommandGroups: [
    {
      name: "xp",
      description: "Manage the XP of user",
      subcommands: [
        slashSubcommand({
          name: "add",
          description: "Add XP to a user",
          options: [
            {
              name: "user",
              description: "The target user",
              type: "user",
              required: true,
            },
            {
              name: "value",
              description: "The amount of XP to add",
              type: "integer",
              required: true,
            },
          ],
          async handle(interaction, user, xp) {
            if (!interaction.inCachedGuild()) {
              return
            }

            const [dbUser] = await Drizzle.insert(xpTable)
              .values({
                userId: user.id,
                guildId: interaction.guild.id,
                xp,
              })
              .onConflictDoUpdate({
                target: [xpTable.userId, xpTable.guildId],
                set: { xp: sql`${xpTable.xp} + ${xp}` },
              })
              .returning()

            if (!dbUser) {
              return
            }

            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("XP changed")
                  .setDescription(
                    `Successfully set ${userMention(
                      user.id,
                    )}'s XP to ${dbUser.xp.toLocaleString("en")}.`,
                  ),
              ],
              ephemeral: true,
            })
          },
        }),
        slashSubcommand({
          name: "set",
          description: "Set a user's XP",
          options: [
            {
              name: "user",
              description: "The target user",
              type: "user",
              required: true,
            },
            {
              name: "value",
              description: "The amount of XP",
              type: "integer",
              required: true,
            },
          ],
          async handle(interaction, user, xp) {
            if (!interaction.inCachedGuild()) {
              return
            }

            const [dbUser] = await Drizzle.insert(xpTable)
              .values({
                userId: user.id,
                guildId: interaction.guild.id,
                xp,
              })
              .onConflictDoUpdate({
                target: [xpTable.userId, xpTable.guildId],
                set: { xp },
              })
              .returning()

            if (!dbUser) {
              return
            }

            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("XP changed")
                  .setDescription(
                    `Successfully set ${userMention(
                      user.id,
                    )}'s XP to ${xp.toLocaleString("en")}.`,
                  ),
              ],
              ephemeral: true,
            })
          },
        }),
      ],
    },
    {
      name: "level",
      description: "Manage the level of user",
      subcommands: [
        slashSubcommand({
          name: "add",
          description: "Add levels to a user",
          options: [
            {
              name: "user",
              description: "The target user",
              type: "user",
              required: true,
            },
            {
              name: "value",
              description: "The amount of levels to add",
              type: "integer",
              required: true,
            },
          ],
          async handle(interaction, user, level) {
            if (!interaction.inCachedGuild()) {
              return
            }

            const [current] = await Drizzle.select()
              .from(xpTable)
              .where(
                and(
                  eq(xpTable.guildId, interaction.guild.id),
                  eq(xpTable.userId, user.id),
                ),
              )

            let xp = totalXpForLevel(level)
            let newLevel = level
            if (current) {
              const currentLevel = levelForTotalXp(current.xp)
              newLevel += currentLevel
              xp =
                totalXpForLevel(currentLevel + level) -
                totalXpForLevel(currentLevel)
            }

            const [dbUser] = await Drizzle.insert(xpTable)
              .values({
                userId: user.id,
                guildId: interaction.guild.id,
                xp,
              })
              .onConflictDoUpdate({
                target: [xpTable.userId, xpTable.guildId],
                set: { xp },
              })
              .returning()

            if (!dbUser) {
              return
            }

            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Level changed")
                  .setDescription(
                    `Successfully set ${userMention(
                      user.id,
                    )}'s level to ${newLevel}.`,
                  ),
              ],
              ephemeral: true,
            })
          },
        }),
        slashSubcommand({
          name: "set",
          description: "Set a user's level",
          options: [
            {
              name: "user",
              description: "The target user",
              type: "user",
              required: true,
            },
            {
              name: "value",
              description: "The level",
              type: "integer",
              required: true,
            },
          ],
          async handle(interaction, user, level) {
            if (!interaction.inCachedGuild()) {
              return
            }

            const xp = totalXpForLevel(level)

            const [dbUser] = await Drizzle.insert(xpTable)
              .values({
                userId: user.id,
                guildId: interaction.guild.id,
                xp,
              })
              .onConflictDoUpdate({
                target: [xpTable.userId, xpTable.guildId],
                set: { xp },
              })
              .returning()

            if (!dbUser) {
              return
            }

            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Level changed")
                  .setDescription(
                    `Successfully set ${userMention(
                      user.id,
                    )}'s level to ${level}.`,
                  ),
              ],
              ephemeral: true,
            })
          },
        }),
      ],
    },
  ],
})
