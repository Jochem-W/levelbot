/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { PermissionFlagsBits } from "discord.js"
import { InstallationContext, InteractionContext } from "../models/command.mjs"
import { slashCommand, slashSubcommand } from "../models/slashCommand.mjs"
import { Drizzle } from "../clients.mjs"
import { settingsTable } from "../schema.mjs"
import { desc, eq } from "drizzle-orm"
import { settingsMessage } from "../messages/settings.mjs"
import { XpConfigs } from "../handlers/loadConfigOnReady.mjs"
import { updateIntervals } from "../handlers/voiceXp.mjs"
import { invalidRangeMessage } from "../messages/invalidRange.mjs"

export const SettingsCommand = slashCommand({
  name: "settings",
  description: "Change XP gain settings for the server",
  nsfw: false,
  integrationTypes: [InstallationContext.GuildInstall],
  contexts: [InteractionContext.Guild],
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  subcommands: [
    slashSubcommand({
      name: "show",
      description: "Show the current settings",
      async handle(interaction) {
        if (!interaction.inCachedGuild()) {
          return
        }

        await interaction.reply(
          settingsMessage(XpConfigs.get(interaction.guild.id) ?? null),
        )
      },
    }),
    slashSubcommand({
      name: "voice",
      description: "Set the amount of XP gained for being in a voice channel",
      options: [
        {
          name: "xp",
          description: "Amount of XP gained",
          type: "integer",
          required: true,
          minValue: 0,
        },
        {
          name: "time",
          description: "Time in seconds spent in a voice channel",
          type: "integer",
          required: true,
          minValue: 0,
        },
        {
          name: "range",
          description: "Range to apply to the XP gained (±)",
          type: "integer",
          required: true,
          minValue: 0,
        },
      ],
      async handle(interaction, xp, time, range) {
        if (!interaction.inCachedGuild()) {
          return
        }

        if (range && xp - range < 0) {
          await interaction.reply(invalidRangeMessage(xp, range))
          return
        }

        const [current] = await Drizzle.select()
          .from(settingsTable)
          .where(eq(settingsTable.guildId, interaction.guild.id))
          .orderBy(desc(settingsTable.id))
          .limit(1)

        const [newConfig] = await Drizzle.insert(settingsTable)
          .values({
            guildId: interaction.guild.id,
            voiceGain: xp,
            voiceCooldown: time,
            voiceRange: range,
            messageGain: current?.messageGain ?? 0,
            messageCooldown: current?.messageCooldown ?? 0,
            messageRange: current?.messageRange ?? 0,
          })
          .returning()

        if (newConfig) {
          XpConfigs.set(interaction.guild.id, newConfig)
        }

        await updateIntervals(interaction.guild)

        await interaction.reply(settingsMessage(newConfig ?? null))
      },
    }),
    slashSubcommand({
      name: "message",
      description: "Set the amount of XP gained for sending messages",
      options: [
        {
          name: "xp",
          description: "Amount of XP gained",
          type: "integer",
          required: true,
          minValue: 0,
        },
        {
          name: "time",
          description: "Time in seconds between messages",
          type: "integer",
          required: true,
          minValue: 0,
        },
        {
          name: "range",
          description: "Range to apply to the XP gained (±)",
          type: "integer",
          required: true,
          minValue: 0,
        },
      ],
      async handle(interaction, xp, time, range) {
        if (!interaction.inCachedGuild()) {
          return
        }

        if (range && xp - range < 0) {
          await interaction.reply(invalidRangeMessage(xp, range))
          return
        }

        const [current] = await Drizzle.select()
          .from(settingsTable)
          .where(eq(settingsTable.guildId, interaction.guild.id))
          .orderBy(desc(settingsTable.id))
          .limit(1)

        const [newConfig] = await Drizzle.insert(settingsTable)
          .values({
            guildId: interaction.guild.id,
            voiceGain: current?.voiceGain ?? 0,
            voiceCooldown: current?.voiceCooldown ?? 0,
            voiceRange: current?.voiceRange ?? 0,
            messageGain: xp,
            messageCooldown: time,
            messageRange: range,
          })
          .returning()

        if (newConfig) {
          XpConfigs.set(interaction.guild.id, newConfig)
        }

        await interaction.reply(settingsMessage(newConfig ?? null))
      },
    }),
  ],
})
