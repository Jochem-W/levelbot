/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { SettingsCommand } from "./commands/settings.mjs"
import { ManageCommand } from "./commands/manage.mjs"
import { RankCommand } from "./commands/rank.mjs"
import type { Command } from "./models/command.mjs"
import type { ApplicationCommandType, Snowflake } from "discord.js"
import { RewardsCommand } from "./commands/rewards.mjs"
import { LeaderboardCommand } from "./commands/leaderboard.mjs"

export const SlashCommands: Command<ApplicationCommandType.ChatInput>[] = [
  SettingsCommand,
  ManageCommand,
  RankCommand,
  RewardsCommand,
  LeaderboardCommand,
]

export const MessageContextMenuCommands: Command<ApplicationCommandType.Message>[] =
  []

export const UserContextMenuCommands: Command<ApplicationCommandType.User>[] =
  []

export const RegisteredCommands = new Map<
  Snowflake,
  Command<ApplicationCommandType>
>()
