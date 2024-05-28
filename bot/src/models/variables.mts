/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import camelcaseKeys from "camelcase-keys"
import { env } from "process"
import { z } from "zod"

const model = z
  .object({
    BOT_TOKEN: z.string(),
    DATABASE_URL: z.string(),
    ERROR_CHANNEL: z.string().optional(),
    INTERNAL_HOSTNAME: z.string(),
  })
  .transform((arg) => camelcaseKeys(arg))

export const Variables = await model.parseAsync(env)
