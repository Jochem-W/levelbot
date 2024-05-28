/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { InstallationContext, InteractionContext } from "../models/command.mjs"
import { slashCommand } from "../models/slashCommand.mjs"
import { sendRankCard } from "../util/card.mjs"

export const RankCommand = slashCommand({
  name: "rank",
  description: "View your rank or that of another member",
  nsfw: false,
  integrationTypes: [InstallationContext.GuildInstall],
  contexts: [InteractionContext.Guild],
  defaultMemberPermissions: null,
  options: [
    {
      name: "user",
      description: "Target user",
      type: "user",
    },
  ],
  async handle(interaction, user) {
    if (!interaction.inCachedGuild()) {
      return
    }

    await sendRankCard(interaction, user ?? interaction.user, false)
  },
})
