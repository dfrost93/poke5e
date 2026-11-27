import { Attributes, type Attribute } from "$lib/dnd/attributes/Attributes"
import type { Edition } from "$lib/srd/editions"

export type Modifier = Attribute | "ac" | "attack" | "damage" | "dc" | "save" | "skill" | "initiative" | "speed"
export type Effect = {
	id: string, name: string, modifiers: Partial<Record<Modifier, number>>,
	turns: number | null, concentration?: boolean, group?: string, mirages?: number,
}
export const noEffects: readonly Effect[] = []
export const modifierKeys: Modifier[] = ["str", "dex", "con", "int", "wis", "cha", "ac", "attack", "damage", "dc", "save", "skill", "initiative", "speed"]

export function totalModifier(effects: readonly Effect[], key: Modifier): number {
	return effects.reduce((sum, effect) => sum + (effect.modifiers[key] ?? 0) + (key === "attack" ? effect.mirages ?? 0 : 0), 0)
}

export function effectiveAttributes(attributes: Attributes, effects: readonly Effect[]): Attributes {
	if (!effects.length) return attributes
	const data = { ...attributes.data }
	for (const { abbr } of Attributes.list) {
		data[abbr] = Math.min(30, Math.max(1, data[abbr] + totalModifier(effects, abbr)))
	}
	return new Attributes(data)
}

// A tick represents the beginning of this creature's next turn. null lasts until manually cleared.
export function advanceEffects(effects: readonly Effect[]): Effect[] {
	return effects.flatMap(effect => effect.turns === null ? [effect] : effect.turns > 1 ? [{ ...effect, turns: effect.turns - 1 }] : [])
}

export function addEffect(effects: readonly Effect[], effect: Effect): Effect[] {
	const remaining = effects.filter(existing => existing.id !== effect.id && !(effect.concentration && existing.concentration))
	return [...remaining, effect]
}

export const selfMoves = ["agility", "barrier", "bulk-up", "defense-curl", "swords-dance"] as const
export const receivedMoves = ["growl", "sand-attack"] as const
export type Preset = typeof selfMoves[number] | typeof receivedMoves[number]
const tier = (level: number) => level >= 17 ? 4 : level >= 10 ? 3 : level >= 5 ? 2 : 1

export function applyPreset(effects: readonly Effect[], edition: Edition, move: Preset, level: number, id: string): Effect[] {
	if (edition !== "2024") return [...effects]
	switch (move) {
		case "agility": return addEffect(effects, { id: move, name: "Agility", modifiers: { speed: 20 }, turns: 10, concentration: true })
		case "barrier": return addEffect(effects, { id: move, name: "Barrier (self)", modifiers: { ac: 2 }, turns: 10, concentration: true })
		case "bulk-up": return addEffect(effects, { id: move, name: "Bulk Up", modifiers: { ac: tier(level), damage: tier(level) }, turns: 10, concentration: true })
		case "defense-curl": return addEffect(effects, { id: move, name: "Defense Curl (AC only; normal resistance manual)", modifiers: { ac: 4 }, turns: 1 })
		case "swords-dance": return addEffect(effects, { id: move, name: "Swords Dance", modifiers: {}, mirages: tier(level) + 1, turns: 10, concentration: true })
		case "growl":
		case "sand-attack": {
			const existing = effects.filter(effect => effect.group === move)
			if (existing.length >= 5) return [...effects]
			return addEffect(effects, { id, group: move, name: move === "growl" ? "Growl (failed save)" : "Sand Attack (failed save)", modifiers: { attack: -1 }, turns: move === "growl" ? 10 : null })
		}
	}
}

export function spendMirages(effects: readonly Effect[], count: number): Effect[] {
	if (!Number.isInteger(count) || count < 1 || count > 2) return [...effects]
	return effects.flatMap(effect => {
		if (effect.id !== "swords-dance" || (effect.mirages ?? 0) < count) return [effect]
		const remaining = (effect.mirages ?? 0) - count
		return remaining ? [{ ...effect, mirages: remaining }] : []
	})
}

export function applyFaintBoost(effects: readonly Effect[], edition: Edition, ability: "beast-boost" | "soul-heart" | "eelevate", saves: readonly Attribute[]): Effect[] {
	if (edition !== "2024" || !saves.length) return [...effects]
	const existing = effects.find(effect => effect.id === ability)
	const modifiers: Effect["modifiers"] = { ...existing?.modifiers }
	for (const attr of new Set(saves)) modifiers[attr] = Math.min(10, (modifiers[attr] ?? 0) + 2)
	const name = ability === "beast-boost" ? "Beast Boost" : ability === "soul-heart" ? "Soul-Heart" : "Eelevate"
	return addEffect(effects, { id: ability, name, modifiers, turns: null })
}
