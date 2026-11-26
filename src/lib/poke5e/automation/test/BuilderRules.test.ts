import { describe, expect, it } from "vitest"
import { featChanges, pokemonLimits, adjustTireless, specializationChanges, pointBuyCost, rollAbilityScores, scoresFromArray, standardArray } from "../BuilderRules"
import { SkillRanks } from "$lib/dnd/skills/SkillRanks"
import { SpecializationList } from "$lib/trainers/specializations/2024/SpecializationList"
import type { Specializations } from "$lib/trainers/specializations/specializations"
import type { LearnedMove } from "$lib/moves/learned/LearnedMove"
const feat = (name:string,id=name) => ({id,name,isCustom:false,description:""})
const move: LearnedMove = { id:"1",moveId:"tackle",pp:{current:4,max:10},modifiers:{toHit:0,damage:0,saveDc:0},customization:{} }
describe("builder rules",()=>{
	it("applies new feats once, and never reapplies existing ones",()=>{
		const selected=[feat("Tough"),feat("AC Up")]
		expect(featChanges([],selected,5,"2024")).toEqual({hp:10,ac:2})
		expect(featChanges(selected,selected,5,"2024")).toEqual({hp:0,ac:0})
	})
	it("protects existing stored bonuses unless removal is explicitly chosen",()=>{
		expect(featChanges([feat("AC Up")],[],5,"2018").ac).toBe(0)
		expect(featChanges([feat("AC Up")],[],5,"2018",true).ac).toBe(-1)
		expect(featChanges([], [feat("Tough")],5,"2024",false,false).hp).toBe(0)
	})
	it("calculates feat-dependent limits",()=>{
		const selected=[feat("Extra Move","1"),feat("Extra Move","2"),feat("Extra Move","3"),feat("Ambidextrous")]
		expect(pokemonLimits(selected,"2024")).toEqual({moves:6,heldItems:2})
		expect(pokemonLimits(selected,"2018")).toEqual({moves:5,heldItems:1})
	})
	it("applies Tireless to new and existing moves without repeated application",()=>{
		const selected=[feat("Tireless")]
		const result=adjustTireless([],selected,[move],[move])
		expect(result[0].pp).toEqual({current:5,max:11})
		expect(adjustTireless(selected,selected,result,result)[0].pp.max).toBe(11)
		expect(adjustTireless(selected,selected,[],[move])[0].pp.max).toBe(11)
		expect(move.pp.max).toBe(10)
	})
	it("applies fixed 2024 specialty ranks and preserves baseline",()=>{
		const scores=scoresFromArray([10,19,10,10,10,10])
		const skills=SkillRanks.fromList([])
		const previous={water:1,fire:0} as Specializations
		const selected={water:3,fire:2} as Specializations
		const result=specializationChanges(scores,skills,previous,selected,Object.values(SpecializationList))
		expect(result.attributes.dex.score).toBe(20)
		expect(result.proficiencies.isExpert("intimidation")).toBe(true)
		expect(scores.dex.score).toBe(19)
		expect(skills.isProficient("intimidation")).toBe(false)
	})
	it("calculates point buy and deterministic dice",()=>{
		expect(pointBuyCost(standardArray)).toBe(27)
		expect(pointBuyCost([15,15,15,15,15,15])).toBe(54)
		expect(pointBuyCost([16,8,8,8,8,8])).toBeNull()
		expect(rollAbilityScores(()=>0)).toEqual([3,3,3,3,3,3])
		expect(rollAbilityScores(()=>0.999)).toEqual([18,18,18,18,18,18])
	})
})