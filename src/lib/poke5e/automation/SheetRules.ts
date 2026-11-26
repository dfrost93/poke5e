// 2024 sheet automation. Pure derived values: never write bonuses into saved base stats.
import type { TrainerInfo, TrainerPokemon } from "$lib/trainers/types"
import type { Edition } from "$lib/srd/editions"
import type { Move } from "$lib/moves/Move"
import type { LearnedMove } from "$lib/moves/learned"
import { Stab } from "$lib/pokemon/stab"
import type { MoveStats } from "$lib/moves/MoveStats"
import { totalModifier, type Effect } from "./ActiveEffects"

type Source = { name: string, amount: number }
export type SheetBonuses = { attack: Source[], damage: Source[], dc: Source[], stabMultiplier: number, notes: string[] }
export type RuleInput = {
	edition: Edition, hp: number, maxHp: number, proficiency: number,
	abilities: readonly string[], items: readonly string[],
	trainerPath?: string, trainerLevel?: number, status?: string | null,
	moveType: string, scope?: string, damaging: boolean,
}

export function moveBonuses(input: RuleInput): SheetBonuses {
	const result: SheetBonuses = { attack: [], damage: [], dc: [], stabMultiplier: 1, notes: [] }
	if (input.edition !== "2024") return result
	const ability = (id: string) => input.abilities.includes(id)
	const item = (id: string) => input.items.includes(id)
	const add = (list: Source[], name: string, amount: number) => list.push({ name, amount })
	const pb = input.proficiency
	const threshold = ["blaze", "overgrow", "torrent", "swarm"].filter(ability)
	if (threshold.length && input.maxHp > 0 && input.hp > 0 && input.hp * 4 <= input.maxHp) {
		result.stabMultiplier = 2
		result.notes.push(threshold.join(", ") + ": double applicable STAB")
	}
	if (input.trainerPath === "Ace Trainer" && (input.trainerLevel ?? 0) >= 2) {
		add(result.attack, "Ace Trainer", 1)
		if (input.damaging) add(result.damage, "Ace Trainer", 1)
	}
	if (ability("serene-grace")) add(result.dc, "Serene Grace", 2)
	if (item("assault-vest") && !input.damaging) result.notes.push("Assault Vest: damaging moves only")
	if (input.damaging) {
		if (ability("fire-mane") && input.moveType === "fire") add(result.damage, "Fire Mane", pb)
		if (ability("steelworker") && input.moveType === "steel") add(result.damage, "Steelworker", pb)
		if (ability("competitive") && ["Poisoned", "BadlyPoisoned", "Burned", "Confused", "Paralysis"].includes(input.status ?? "")) add(result.damage, "Competitive", pb)
		if (item("muscle-band") && input.scope === "melee") add(result.damage, "Muscle Band (once per move)", pb)
		if (item("wise-glasses") && input.scope === "ranged") add(result.damage, "Wise Glasses (once per move)", pb)
		const typeItems: Record<string, [string, string]> = {
			fighting: ["black-belt", "Black Belt"], dark: ["black-glasses", "Black Glasses"],
			fire: ["charcoal", "Charcoal"], dragon: ["dragon-fang", "Dragon Fang"],
			fairy: ["fairy-feather", "Fairy Feather"], rock: ["hard-stone", "Hard Stone"],
			electric: ["magnet", "Magnet"], grass: ["miracle-seed", "Miracle Seed"],
			water: ["mystic-water", "Mystic Water"], ice: ["never-melt-ice", "Never-Melt Ice"],
			poison: ["poison-barb", "Poison Barb"], flying: ["sharp-beak", "Sharp Beak"],
			normal: ["silk-scarf", "Silk Scarf"], bug: ["silver-powder", "Silver Powder"],
			ground: ["soft-sand", "Soft Sand"], ghost: ["spell-tag", "Spell Tag"],
			psychic: ["twisted-spoon", "Twisted Spoon"],
		}
		const typed = typeItems[input.moveType]
		if (typed && item(typed[0])) add(result.damage, typed[1] + " (once per move)", pb)
	}
	return result
}

export function standardItemIds(pokemon: Pick<TrainerPokemon, "items">): string[] {
	return pokemon.items.filter(item => item.type === "standard").map(item => item.itemId)
}

export function initiativeBonus(edition: Edition, dex: number, pb: number, alert: boolean, quickClaw = false): number {
	return dex + (alert ? (edition === "2024" ? pb : 5) : 0) + (edition === "2024" && quickClaw ? 3 : 0)
}

export function characterInitiative(edition: Edition, character: Pick<TrainerInfo, "attributes" | "level" | "feats">, items: string[] = []): number {
	return initiativeBonus(edition, character.attributes.dex.modifier, character.level.proficiencyBonus,
		character.feats.some(feat => !feat.isCustom && feat.name.toLowerCase() === "alert"), items.includes("quick-claw"))
}

export function effectiveArmorClass(edition: Edition, ac: number, items: string[]): number {
	return ac + (edition === "2024" && items.includes("assault-vest") ? 1 : 0)
}

export function generalistBonus(edition: Edition, path: string | undefined, level: number, pb: number, proficient: boolean): number {
	return edition === "2024" && path === "Hobbyist" && level >= 9 && !proficient ? Math.floor(pb / 2) : 0
}

export function calculateSheetMove(edition: Edition, move: Move, learnedMove: LearnedMove, pokemon: TrainerPokemon, trainer?: TrainerInfo, effects: readonly Effect[] = []): { stats: MoveStats, notes: string[] } {
	const damaging = move.dice ? move.dice.type === "damage" : move.damage != null && move.damage.data.type !== "healing"
	const bonuses = moveBonuses({
		edition, hp: pokemon.hp.current, maxHp: pokemon.hp.max, proficiency: pokemon.level.proficiencyBonus,
		abilities: pokemon.abilities.map(a => a.referenceId ?? ""), items: standardItemIds(pokemon),
		trainerPath: trainer?.path.name, trainerLevel: trainer?.level.data, status: pokemon.status,
		moveType: learnedMove.customization.type ?? move.type, scope: move.attack?.scope, damaging,
	})
	const baseStab = pokemon.stab ?? Stab.default()
	// Preserve the original STAB formula and multiply only the amount it contributes.
	const multiplier = bonuses.stabMultiplier
	const effectiveStab = new class extends Stab {
		override calculate(...args: Parameters<Stab["calculate"]>): number {
			return baseStab.calculate(...args) * multiplier
		}
	}(baseStab.data)
	const stats = move.calculateMoveStats(edition, {
		attributes: pokemon.attributes, level: pokemon.level, type: pokemon.type.data,
		stab: effectiveStab, learnedMove,
	})
	const sum = (sources: Source[]) => sources.reduce((total, source) => total + source.amount, 0)
	const notes = [...bonuses.notes]
	const describe = (label: string, sources: Source[]) => sources.forEach(source => notes.push(source.name + ": +" + source.amount + " " + label))
	if (stats.toHit != null) { stats.toHit += sum(bonuses.attack); describe("attack", bonuses.attack) }
	if (stats.save) { stats.save.dc += sum(bonuses.dc); describe("save DC", bonuses.dc) }
	if (stats.damage && damaging) { stats.damage.mod += sum(bonuses.damage); describe("damage", bonuses.damage) }
	const activeAttack = totalModifier(effects, "attack")
	const activeDamage = totalModifier(effects, "damage")
	const activeDc = totalModifier(effects, "dc")
	if (stats.toHit != null) stats.toHit += activeAttack
	if (stats.damage && damaging) stats.damage.mod += activeDamage
	if (stats.save) stats.save.dc += activeDc
	for (const effect of effects) {
		const attack = (effect.modifiers.attack ?? 0) + (effect.mirages ?? 0)
		const damage = effect.modifiers.damage ?? 0
		const dc = effect.modifiers.dc ?? 0
		if ((attack && stats.toHit != null) || (damage && stats.damage && damaging) || (dc && stats.save)) notes.push(effect.name + " (active)")
	}
	return { stats, notes }
}
