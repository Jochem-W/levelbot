/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { InstallationContext, InteractionContext } from "../models/command.mjs"
import { slashCommand } from "../models/slashCommand.mjs"
import { leaderboardMessage } from "../messages/leaderboard.mjs"

export const LeaderboardCommand = slashCommand({
  name: "leaderboard",
  description: "Show the leaderboard for the server",
  nsfw: false,
  integrationTypes: [InstallationContext.GuildInstall],
  contexts: [InteractionContext.Guild],
  defaultMemberPermissions: null,
  async handle(interaction) {
    if (!interaction.inCachedGuild()) {
      return
    }

    await interaction.reply(
      await leaderboardMessage(interaction.guild, interaction.user, 0),
    )
  },
})
