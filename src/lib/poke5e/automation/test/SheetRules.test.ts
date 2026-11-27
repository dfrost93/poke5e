import { describe, expect, it } from "vitest"
import { moveBonuses, initiativeBonus, effectiveArmorClass, generalistBonus, type RuleInput } from "../SheetRules"

const base: RuleInput = { edition: "2024", hp: 11, maxHp: 40, proficiency: 3, abilities: ["blaze"], items: [], moveType: "fire", scope: "melee", damaging: true }

describe("2024 sheet rules", () => {
	it("activates and removes threshold STAB without mutating state", () => {
		expect(moveBonuses(base).stabMultiplier).toBe(1)
		expect(moveBonuses({ ...base, hp: 10 }).stabMultiplier).toBe(2)
		expect(moveBonuses({ ...base, hp: 0 }).stabMultiplier).toBe(1)
		expect(moveBonuses({ ...base, hp: 11 }).stabMultiplier).toBe(1)
		expect(base.hp).toBe(11)
	})
	it("uses an exact fractional threshold", () => {
		expect(moveBonuses({ ...base, maxHp: 39, hp: 10 }).stabMultiplier).toBe(1)
		expect(moveBonuses({ ...base, maxHp: 39, hp: 9 }).stabMultiplier).toBe(2)
	})
	it("combines attack and damage sources", () => {
		const result = moveBonuses({ ...base, trainerPath: "Ace Trainer", trainerLevel: 2, items: ["muscle-band", "charcoal"] })
		expect(result.attack.map(x => x.amount)).toEqual([1])
		expect(result.damage.map(x => x.amount)).toEqual([1, 3, 3])
	})
	it("does not grant damage to nondamaging moves", () => {
		expect(moveBonuses({ ...base, damaging: false, items: ["muscle-band", "charcoal", "assault-vest"] }).damage).toEqual([])
		expect(moveBonuses({ ...base, damaging: false, items: ["assault-vest"] }).notes).toContain("Assault Vest: damaging moves only")
	})
	it("checks item scope and type", () => {
		expect(moveBonuses({ ...base, moveType: "water", scope: "ranged", items: ["muscle-band", "charcoal"] }).damage).toEqual([])
		expect(moveBonuses({ ...base, scope: "ranged", items: ["wise-glasses"] }).damage[0].amount).toBe(3)
	})
	it("applies Serene Grace", () => expect(moveBonuses({ ...base, abilities: ["serene-grace"] }).dc[0].amount).toBe(2))
	it("does not apply 2024 modifiers in the 2018 edition", () => {
		expect(moveBonuses({ ...base, edition: "2018", hp: 1, items: ["charcoal"], trainerPath: "Ace Trainer", trainerLevel: 20 }).damage).toEqual([])
		expect(moveBonuses({ ...base, edition: "2018", hp: 1 }).stabMultiplier).toBe(1)
	})
	it("calculates initiative including Alert and Quick Claw", () => {
		expect(initiativeBonus("2024", 3, 3, true, true)).toBe(9)
		expect(initiativeBonus("2018", 3, 3, true, true)).toBe(8)
	})
	it("adds removable armor without altering the stored AC", () => {
		expect(effectiveArmorClass("2024", 15, ["assault-vest"])).toBe(16)
		expect(effectiveArmorClass("2024", 15, [])).toBe(15)
	})
	it("applies Generalist only to untrained skills at level nine or higher", () => {
		expect(generalistBonus("2024", "Hobbyist", 9, 4, false)).toBe(2)
		expect(generalistBonus("2024", "Hobbyist", 8, 4, false)).toBe(0)
		expect(generalistBonus("2024", "Hobbyist", 9, 4, true)).toBe(0)
	})
})

it("supports all 17 verified typed held-item bonuses", () => {
	const pairs = [["fighting","black-belt"],["dark","black-glasses"],["fire","charcoal"],["dragon","dragon-fang"],["fairy","fairy-feather"],["rock","hard-stone"],["electric","magnet"],["grass","miracle-seed"],["water","mystic-water"],["ice","never-melt-ice"],["poison","poison-barb"],["flying","sharp-beak"],["normal","silk-scarf"],["bug","silver-powder"],["ground","soft-sand"],["ghost","spell-tag"],["psychic","twisted-spoon"]]
	for (const [moveType, item] of pairs) expect(moveBonuses({ ...base, moveType, items: [item] }).damage[0]?.amount).toBe(3)
})
