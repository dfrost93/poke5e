import { describe, expect, it } from "vitest"
import { locationOf, inStorage, relocatePokemon, reorderStorage, type PokemonStorage } from "../storage"
const team = [{id:"1",hp:12},{id:"2",storage:"box" as PokemonStorage,hp:7},{id:"3",hp:9}]
describe("PC storage",()=>{
	it("keeps legacy Pokémon in party",()=>expect(locationOf(team[0])).toBe("party"))
	it("separates party and PC",()=>{expect(inStorage(team,"party").map(p=>p.id)).toEqual(["1","3"]);expect(inStorage(team,"box").map(p=>p.id)).toEqual(["2"])})
	it("deposits without changing Pokémon data",()=>{const result=relocatePokemon(team,"1","box");expect(inStorage(result,"box")).toEqual([team[1],{...team[0],storage:"box"}]);expect(team[0]).toEqual({id:"1",hp:12})})
	it("withdraws to the end of party",()=>expect(inStorage(relocatePokemon(team,"2","party"),"party").map(p=>p.id)).toEqual(["1","3","2"]))
	it("does not move twice",()=>expect(relocatePokemon(team,"2","box")).toEqual(team))
	it("reorders only the selected storage",()=>expect(reorderStorage(team,"party",0,1).map(p=>p.id)).toEqual(["3","2","1"]))
})