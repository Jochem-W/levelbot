/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { EmbedBuilder } from "discord.js"
import { settingsTable } from "../schema.mjs"

export function settingsMessage(
  settings: typeof settingsTable.$inferSelect | null,
) {
  if (!settings) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle("No settings")
          .setDescription(
            "The bot has yet to be configured. Please run the settings commands.",
          ),
      ],
      ephemeral: true,
    }
  }

  return {
    embeds: [
      new EmbedBuilder().setTitle("XP gain settings").setFields(
        {
          name: "XP from voice channels",
          value:
            !settings.voiceGain || !settings.voiceCooldown
              ? "❌"
              : `✅ ${settings.voiceGain}${
                  settings.voiceRange ? `±${settings.voiceRange}` : ""
                } XP every ${settings.voiceCooldown} second${
                  settings.voiceCooldown === 1 ? "" : "s"
                }`,
        },
        {
          name: "XP from sending messages",
          value: !settings.messageGain
            ? "❌"
            : `✅ ${settings.messageGain}${
                settings.messageRange ? `±${settings.messageRange}` : ""
              } XP per message${
                settings.messageCooldown
                  ? ` (once every ${settings.messageCooldown} second${
                      settings.messageCooldown === 1 ? "" : "s"
                    })`
                  : ""
              }`,
        },
      ),
    ],
    ephemeral: true,
  }
}
