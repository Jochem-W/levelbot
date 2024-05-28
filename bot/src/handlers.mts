/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import { Interaction } from "./handlers/interaction.mjs"
import { LoadConfigOnReady } from "./handlers/loadConfigOnReady.mjs"
import { MessageXp } from "./handlers/messageXp.mjs"
import { Ready } from "./handlers/ready.mjs"
import { VoiceXp } from "./handlers/voiceXp.mjs"
import type { Handler } from "./models/handler.mjs"
import type { ClientEvents } from "discord.js"

export const Handlers: Handler<keyof ClientEvents>[] = [
  Ready,
  Interaction,
  MessageXp,
  VoiceXp,
  LoadConfigOnReady,
]
