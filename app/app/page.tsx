/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import Card from "@/components/Card"
import { levelForTotalXp, totalXpForLevel, xpForLevelUp } from "@/util/xp"
import { z } from "zod"

const model = z.object({
  id: z.string(),
  name: z.string(),
  discriminator: z.string(),
  xp: z.coerce.number(),
  position: z.coerce.number(),
  avatar: z.string().nullable().optional().default(null),
})

export default async function Page({
  searchParams,
}: {
  searchParams: {
    id?: string
    name?: string
    avatar?: string
    discriminator?: string
    xp?: string
    position?: string
  }
}) {
  const parsed = await model.parseAsync(searchParams)

  const level = levelForTotalXp(parsed.xp)
  parsed.xp -= totalXpForLevel(level)

  return (
    <Card
      user={parsed}
      position={parsed.position}
      xp={parsed.xp}
      xpMax={xpForLevelUp(level)}
      level={level}
    ></Card>
  )
}
