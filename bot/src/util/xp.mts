/**
 * Licensed under AGPL 3.0 or newer. Copyright (C) 2024 Jochem W. <license (at) jochem (dot) cc>
 */

export function totalXpForLevel(level: number) {
  return 100 * level ** 2
}

export function levelForTotalXp(xp: number) {
  return Math.floor(Math.sqrt(xp / 100))
}

export function xpForLevelUp(level: number) {
  return totalXpForLevel(level + 1) - totalXpForLevel(level)
}
