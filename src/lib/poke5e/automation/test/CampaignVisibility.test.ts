import { describe, expect, it } from "vitest"
import { defaultEnemyVisibility, healthDescription, projectEnemy, type PrivateEnemy } from "../CampaignVisibility"
const enemy: PrivateEnemy = { id: "e1", name: "Gengar", artwork: "gengar.png",
 types: ["ghost", "poison"], hp: 46, maxHp: 92, ac: 16, ability: "cursed-body",
 conditions: ["paralyzed"], moves: ["lick", "shadow-ball"], abilityScores: [10,18,14,16,14,12],
 notes: "Secret objective", hidden: false }
describe("enemy visibility contract", () => {
 it("omits exact stats and private fields by default", () => {
  expect(projectEnemy(enemy, defaultEnemyVisibility)).toEqual({
   id: "e1", name: "Gengar", artwork: "gengar.png", types: ["ghost","poison"],
   health: "wounded", conditions: ["paralyzed"],
  })
 })
 it("does not reveal hidden enemies at all", () => {
  expect(projectEnemy({...enemy, hidden:true}, defaultEnemyVisibility)).toBeNull()
 })
 it("reveals only explicitly permitted fields and known moves", () => {
  expect(projectEnemy(enemy, {...defaultEnemyVisibility, identity:false, typing:false,
   health:"exact", armorClass:true, ability:true, conditions:false, revealedMoves:["lick","unknown"]})).toEqual({
   id:"e1",name:"Unknown Pokémon",health:"wounded",hp:46,maxHp:92,ac:16,ability:"cursed-body",moves:["lick"],
  })
 })
 it("can conceal health entirely", () => {
  expect(projectEnemy(enemy,{...defaultEnemyVisibility,health:"hidden"})).not.toHaveProperty("health")
 })
 it("categorizes health at boundaries", () => {
  expect([100,76,75,51,50,26,25,1,0].map(hp=>healthDescription(hp,100))).toEqual(
   ["uninjured","lightly injured","injured","injured","wounded","wounded","critically wounded","critically wounded","fainted"])
 })
})
