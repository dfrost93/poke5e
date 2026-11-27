import { describe, expect, it } from "vitest"
import { Attributes } from "$lib/dnd/attributes/Attributes"
import { addEffect, advanceEffects, applyPreset, applyFaintBoost, effectiveAttributes, spendMirages, totalModifier, type Effect } from "../ActiveEffects"

describe("active effects", () => {
	it("derives scores without mutating base", () => {
		const base = new Attributes({ str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })
		const active: Effect[] = [{ id: "1", name: "test", modifiers: { str: 2, dex: -2 }, turns: 1 }]
		expect(effectiveAttributes(base, active).str.modifier).toBe(3)
		expect(effectiveAttributes(base, active).dex.modifier).toBe(-1)
		expect(base.str.score).toBe(14)
		expect(effectiveAttributes(base, advanceEffects(active)).str.modifier).toBe(2)
	})
	it("replaces concentration and leaves unrelated effects", () => {
		const growl = applyPreset([], "2024", "growl", 5, "g")
		const agility = applyPreset(growl, "2024", "agility", 5, "a")
		const bulk = applyPreset(agility, "2024", "bulk-up", 5, "b")
		expect(totalModifier(bulk, "speed")).toBe(0)
		expect(totalModifier(bulk, "attack")).toBe(-1)
		expect(totalModifier(bulk, "ac")).toBe(2)
		expect(totalModifier(bulk, "damage")).toBe(2)
	})
	it("caps Growl and expires individual stacks", () => {
		let effects: Effect[] = []
		for (let i=0;i<6;i++) effects = applyPreset(effects, "2024", "growl", 1, String(i))
		expect(totalModifier(effects, "attack")).toBe(-5)
		for (let i=0;i<9;i++) effects = advanceEffects(effects)
		expect(totalModifier(effects, "attack")).toBe(-5)
		expect(advanceEffects(effects)).toEqual([])
	})
	it("keeps encounter effects during turn advance", () => {
		expect(advanceEffects(applyPreset([], "2024", "sand-attack", 1, "s"))[0].turns).toBeNull()
	})
	it("expires Defense Curl at next turn", () => {
		const effect = applyPreset([], "2024", "defense-curl", 1, "d")
		expect(totalModifier(effect, "ac")).toBe(4)
		expect(advanceEffects(effect)).toEqual([])
	})
	it("scales and spends sword mirages", () => {
		let effects = applyPreset([], "2024", "swords-dance", 17, "s")
		expect(totalModifier(effects, "attack")).toBe(5)
		effects = spendMirages(effects, 2)
		expect(totalModifier(effects, "attack")).toBe(3)
		effects = spendMirages(spendMirages(effects, 2), 1)
		expect(effects).toEqual([])
	})
	it("caps each faint-triggered attribute bonus", () => {
		let effects: Effect[] = []
		for (let i=0;i<6;i++) effects = applyFaintBoost(effects, "2024", "beast-boost", ["str", "wis"])
		expect(totalModifier(effects, "str")).toBe(10)
		expect(totalModifier(effects, "wis")).toBe(10)
		expect(totalModifier(effects, "dex")).toBe(0)
		expect(effects[0].turns).toBeNull()
	})
	it("does not apply 2024 presets in 2018", () => {
		expect(applyPreset([], "2018", "bulk-up", 5, "b")).toEqual([])
		expect(applyFaintBoost([], "2018", "soul-heart", ["wis"])).toEqual([])
	})
	it("does not mutate effect input when replacing or ticking", () => {
		const effects = addEffect([], { id: "x", name: "x", modifiers: { ac: 1 }, turns: 2 })
		expect(advanceEffects(effects)[0].turns).toBe(1)
		expect(effects[0].turns).toBe(2)
		expect(addEffect(effects, { ...effects[0], turns: 4 }).length).toBe(1)
	})
})
