/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { EmbedBuilder, PermissionFlagsBits, roleMention } from "discord.js"
import { InstallationContext, InteractionContext } from "../models/command.mjs"
import { slashCommand, slashSubcommand } from "../models/slashCommand.mjs"
import { eq, and } from "drizzle-orm"
import postgres from "postgres"
import { Drizzle } from "../clients.mjs"
import { roleRewardsMessage } from "../messages/roleRewards.mjs"
import { rewardsTable } from "../schema.mjs"
import Fuse from "fuse.js"

export const RewardsCommand = slashCommand({
  name: "rewards",
  description: "Commands related to configuring role rewards for levels",
  nsfw: false,
  integrationTypes: [InstallationContext.GuildInstall],
  contexts: [InteractionContext.Guild],
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  subcommands: [
    slashSubcommand({
      name: "list",
      description: "List all the current role rewards",
      async handle(interaction) {
        if (!interaction.inCachedGuild()) {
          return
        }

        await interaction.reply(
          await roleRewardsMessage(interaction.guild, {
            afterInclusive: 0,
          }),
        )
      },
    }),
    slashSubcommand({
      name: "clear",
      description: "Remove all current role rewards",
      async handle(interaction) {
        if (!interaction.inCachedGuild()) {
          return
        }

        const deleted = await Drizzle.delete(rewardsTable)
          .where(eq(rewardsTable.guildId, interaction.guild.id))
          .returning()

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Role rewards cleared")
              .setDescription(
                `Successfully removed ${deleted.length} role reward${
                  deleted.length === 1 ? "" : "s"
                }.`,
              ),
          ],
          ephemeral: true,
        })
      },
    }),
    slashSubcommand({
      name: "add",
      description: "Add a role reward",
      options: [
        {
          name: "level",
          description: "Required level",
          type: "integer",
          required: true,
        },
        {
          name: "role",
          description: "Given role",
          type: "role",
          required: true,
        },
      ],
      async handle(interaction, level, role) {
        if (!interaction.inCachedGuild()) {
          return
        }

        try {
          await Drizzle.insert(rewardsTable).values({
            guildId: interaction.guild.id,
            level,
            roleId: role.id,
          })
        } catch (e) {
          if (!(e instanceof postgres.PostgresError) || e.code !== "23505") {
            throw e
          }

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Reward not added")
                .setDescription(
                  `Couldn't add ${roleMention(
                    role.id,
                  )} as a reward for hitting level ${level}, as it's already a reward for a level.`,
                ),
            ],
          })
          return
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Role reward added")
              .setDescription(
                `Successfully added ${roleMention(
                  role.id,
                )} as a reward for hitting level ${level}.`,
              ),
          ],
          ephemeral: true,
        })
      },
    }),
    slashSubcommand({
      name: "remove",
      description: "Remove a role reward",
      options: [
        {
          name: "reward",
          type: "number",
          description: "Reward to remove",
          required: true,
          async autocomplete(interaction, value) {
            if (!interaction.inCachedGuild()) {
              return []
            }

            const rewards = await Drizzle.select()
              .from(rewardsTable)
              .where(eq(rewardsTable.guildId, interaction.guild.id))

            const searchList = rewards.map(({ id, roleId, level }) => ({
              id: id,
              roleId,
              roleName:
                interaction.guild.roles.cache.get(roleId)?.name ?? roleId,
              levelText: `Level ${level}`,
            }))

            if (!value) {
              return searchList
                .map(({ levelText, roleName, id }) => ({
                  name: `${levelText}: ${roleName}`,
                  value: id,
                }))
                .slice(0, 25)
            }

            const searchResults = new Fuse(searchList, {
              keys: ["roleId", "roleName", "levelText"],
            }).search(value)

            return searchResults
              .map(({ item: { levelText, roleName, id } }) => ({
                name: `${levelText}: ${roleName}`,
                value: id,
              }))
              .slice(0, 25)
          },
        },
      ],
      async handle(interaction, id) {
        if (!interaction.inCachedGuild()) {
          return
        }

        const [deleted] = await Drizzle.delete(rewardsTable)
          .where(
            and(
              eq(rewardsTable.guildId, interaction.guild.id),
              eq(rewardsTable.id, id),
            ),
          )
          .returning()

        if (!deleted) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Reward removal failed")
                .setDescription(
                  `A reward with the ID ${id} does not exist for your server.`,
                ),
            ],
          })
          return
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Role reward removed")
              .setDescription(
                `Successfully removed the ${roleMention(
                  deleted.roleId,
                )} reward for hitting level ${deleted.level}.`,
              ),
          ],
        })
      },
    }),
  ],
})
