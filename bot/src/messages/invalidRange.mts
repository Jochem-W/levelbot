/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { EmbedBuilder } from "discord.js"

export function invalidRangeMessage(xp: number, range: number) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Invalid XP range")
        .setDescription(
          `The range ${xp - range}-${
            xp + range
          } is invalid, as it starts below 0.`,
        ),
    ],
    ephemeral: true,
  }
}
