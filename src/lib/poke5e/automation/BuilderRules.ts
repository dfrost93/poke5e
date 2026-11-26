import type { ChosenFeat } from "$lib/dnd/feats/ChosenFeat"
import { Attributes, type Attribute } from "$lib/dnd/attributes/Attributes"
import { SkillRanks } from "$lib/dnd/skills/SkillRanks"
import type { Edition } from "$lib/srd/editions"
import type { LearnedMove } from "$lib/moves/learned/LearnedMove"
import { Resource } from "$lib/poke5e/resource/Resource"
import type { Specialization, Specializations } from "$lib/trainers/specializations/specializations"

const hasFeat = (feats: readonly ChosenFeat[], name: string) => feats.some(f => !f.isCustom && f.name === name)
const countFeat = (feats: readonly ChosenFeat[], name: string) => feats.filter(f => !f.isCustom && f.name === name).length
const featDelta = (before: readonly ChosenFeat[], after: readonly ChosenFeat[], name: string, remove: boolean) =>
	Math.max(remove ? -1 : 0, Number(hasFeat(after,name)) - Number(hasFeat(before,name)))

/** Existing saved scores may already contain acquisition bonuses. Only apply changes from the editing baseline. */
export function featChanges(before: readonly ChosenFeat[], after: readonly ChosenFeat[], level: number, edition: Edition, remove = false, enabled = true) {
	return {
		hp: enabled ? featDelta(before,after,"Tough",remove) * 2 * level : 0,
		ac: enabled ? featDelta(before,after,"AC Up",remove) * (edition === "2024" ? 2 : 1) : 0,
	}
}

export function pokemonLimits(feats: readonly ChosenFeat[], edition: Edition) {
	return { moves: 4 + Math.min(edition === "2024" ? 2 : 1, countFeat(feats,"Extra Move")),
		heldItems: 1 + Number(edition === "2024" && hasFeat(feats,"Ambidextrous")) }
}

/** Stored PP includes feat bonuses. New moves start from their selected PP, not the prior move's cap. */
export function adjustTireless(before: readonly ChosenFeat[], after: readonly ChosenFeat[], oldMoves: readonly LearnedMove[], moves: readonly LearnedMove[], remove = false, enabled = true): LearnedMove[] {
	if (!enabled) return [...moves]
	const delta = featDelta(before,after,"Tireless",remove)
	return moves.map(move => {
		const existing = oldMoves.some(old => old.id === move.id && old.moveId === move.moveId)
		const change = existing ? delta : Number(hasFeat(after,"Tireless"))
		if (!change) return move
		return { ...move, pp: Resource.adjustMax(move.pp,Math.max(0,move.pp.max + change)) }
	})
}

/** 2024 has one fixed attribute or skill per specialization. No inference about legacy choices. */
export function specializationChanges(attributes: Attributes, proficiencies: SkillRanks, before: Specializations, after: Specializations, list: readonly Specialization[], enabled = true) {
	const scores = attributes.copy(), skills = proficiencies.copy()
	const notes: string[] = []
	if (enabled) for (const specialization of list) {
		const ranks = Math.max(0,Math.min(5,after[specialization.type] ?? 0)-Math.max(0,before[specialization.type] ?? 0))
		if (!ranks) continue
		for (const effect of specialization.effect) {
			if (effect.type === "asi" && effect.value.length === 1) {
				const attr = effect.value[0], previous = scores.data[attr]
				scores.data[attr] = Math.max(previous,Math.min(20,previous+ranks))
				const delta = scores.data[attr]-previous
				if (delta) notes.push(specialization.name + ": " + attr.toUpperCase() + " +" + delta)
			}
			if (effect.type === "proficiency" && effect.value.length === 1) {
				const skill = effect.value[0], previous = skills.data[skill]
				skills.data[skill] = Math.min(2,previous+ranks)
				if (skills.data[skill] !== previous) notes.push(specialization.name + ": " + skill + (skills.data[skill] === 2 ? " expertise" : " proficiency"))
			}
		}
	}
	return { attributes: scores, proficiencies: skills, notes }
}

export const standardArray = [15,14,13,12,10,8] as const
const costs: Record<number,number> = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}
export function pointBuyCost(values: readonly number[]): number | null {
	if (values.length !== 6 || values.some(value => !(value in costs))) return null
	return values.reduce((total,value)=>total+costs[value],0)
}
export function rollAbilityScores(random: () => number = Math.random): number[] {
	return Array.from({length:6},()=>Array.from({length:4},()=>1+Math.floor(random()*6)).sort((a,b)=>b-a).slice(0,3).reduce((sum,die)=>sum+die,0))
}
export function scoresFromArray(values: readonly number[]): Attributes {
	const data = Object.fromEntries(Attributes.list.map(({abbr},i)=>[abbr,values[i]])) as Record<Attribute,number>
	return new Attributes(data)
}
