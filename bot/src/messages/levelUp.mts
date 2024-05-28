/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import {
  EmbedBuilder,
  GuildMember,
  MessageCreateOptions,
  MessageFlags,
  Snowflake,
  roleMention,
  userMention,
} from "discord.js"

export function levelUpMessage(
  member: GuildMember,
  level: number,
  roles: Snowflake[],
  mention?: boolean,
) {
  const lastRole = roles.pop()
  let rolesText = roles.map((id) => roleMention(id)).join(", ")
  if (lastRole) {
    rolesText = ` and were given the ${
      rolesText ? rolesText + "and " : ""
    } ${roleMention(lastRole)} role${rolesText ? "s" : ""}.`
  }

  const message: MessageCreateOptions = {
    embeds: [
      new EmbedBuilder()
        .setAuthor({ name: "Level up!", iconURL: member.displayAvatarURL() })
        .setDescription(`You are now level ${level}${rolesText}!`),
    ],
    flags: [MessageFlags.SuppressNotifications],
  }

  if (mention) {
    message.content = userMention(member.id)
  }

  return message
}
