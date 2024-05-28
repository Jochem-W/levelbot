/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { Colours } from "../models/colours.mjs"
import { Variables } from "../models/variables.mjs"
import { fetchChannel } from "./discord.mjs"
import { ChannelType, Client, EmbedBuilder, codeBlock } from "discord.js"

export async function logError(client: Client, error: unknown) {
  console.log(error)

  if (!Variables.errorChannel) {
    return
  }

  if (!client.isReady()) {
    console.error("Client wasn't ready to properly log error", error)
    return
  }

  try {
    const channel = await fetchChannel(
      client,
      Variables.errorChannel,
      ChannelType.GuildText,
    )

    const embed = new EmbedBuilder()
      .setTitle("An unexpected error has occurred")
      .setColor(Colours.red[500])

    if (error instanceof Error) {
      embed.setDescription(error.stack ? codeBlock(error.stack) : error.message)
    } else {
      embed.setDescription(JSON.stringify(error))
    }

    await channel.send({ embeds: [embed] })
  } catch (e) {
    console.error(
      "Encountered an error",
      e,
      "while trying to log another error",
      error,
    )
  }
}
