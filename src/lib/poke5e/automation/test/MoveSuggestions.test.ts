import { describe, expect, it } from "vitest"
import { recommendMoves } from "../MoveSuggestions"
const moves = [{id:"a",name:"A",type:"fire"},{id:"b",name:"B",type:"water"},{id:"c",name:"C",type:"electric"},{id:"d",name:"D",type:"fire"}]
describe("move suggestions", () => {
	it("prioritizes level-eligible same-type species moves", () => expect(recommendMoves(moves, ["a","b"], ["d"], ["fire"], []).map(x=>x.move.id)).toEqual(["a","b"]))
	it("recommends non-species type matches without declaring them eligible", () => expect(recommendMoves(moves, ["a"], [], ["electric"], []).map(x=>[x.move.id,x.rank])).toEqual([["a",1],["c",2]]))
	it("updates when chosen types change", () => expect(recommendMoves(moves, [], [], ["water"], []).map(x=>x.move.id)).toEqual(["b"]))
	it("omits already known and later level moves", () => expect(recommendMoves(moves, ["a"], ["d"], ["fire"], ["a"])).toEqual([]))
})