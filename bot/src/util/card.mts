/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

import {
  User,
  AttachmentBuilder,
  Interaction,
  AutocompleteInteraction,
} from "discord.js"
import { and, eq, sql } from "drizzle-orm"
import puppeteer from "puppeteer"
import { Drizzle } from "../clients.mjs"
import { xpTable } from "../schema.mjs"
import { Variables } from "../models/variables.mjs"
import { userPositionFactory } from "./db.mjs"

const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: { width: 1024, height: 384 },
  args: ["--no-sandbox"],
})

export async function sendRankCard(
  interaction: Exclude<Interaction<"cached">, AutocompleteInteraction>,
  user: User,
  ephemeral: boolean,
) {
  const userPosition = userPositionFactory(interaction.guild)

  let [levelData] = await Drizzle.select({
    xp: xpTable.xp,
    position: userPosition.position,
  })
    .from(xpTable)
    .where(
      and(
        eq(xpTable.userId, user.id),
        eq(xpTable.guildId, interaction.guild.id),
      ),
    )
    .innerJoin(userPosition, eq(userPosition.userId, xpTable.userId))

  if (!levelData) {
    const [countResult] = await Drizzle.select({
      count: sql<string>`count(*)`,
    })
      .from(xpTable)
      .where(eq(xpTable.guildId, interaction.guild.id))
    if (!countResult) {
      return
    }

    levelData = {
      xp: 0,
      position: (parseInt(countResult.count) + 1).toString(10),
    }
  }

  const url = new URL(Variables.internalHostname)
  url.searchParams.set("id", user.id)
  url.searchParams.set("name", user.displayName)
  url.searchParams.set("discriminator", user.discriminator)
  url.searchParams.set("xp", levelData.xp.toString(10))
  url.searchParams.set("position", levelData.position)

  if (user.avatar) {
    url.searchParams.set("avatar", user.avatar)
  }

  const page = await browser.newPage()
  await page.goto(url.toString())
  const screenshot = await page.screenshot()

  await interaction.reply({
    files: [new AttachmentBuilder(screenshot, { name: "card.png" })],
    ephemeral,
  })

  await page.close()
}
