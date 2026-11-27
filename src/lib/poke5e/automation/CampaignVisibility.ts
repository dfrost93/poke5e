// Pure presentation contract for encounter data. Must run on a trusted server
// before delivery to players; client-side filtering is NOT authorization.
export type EnemyHealth = "uninjured" | "lightly injured" | "injured" | "wounded" | "critically wounded" | "fainted"
export type Visibility = {
 identity: boolean; typing: boolean; health: "hidden" | "descriptive" | "exact";
 armorClass: boolean; ability: boolean; conditions: boolean;
 revealedMoves: readonly string[];
}
export const defaultEnemyVisibility: Visibility = {
 identity: true, typing: true, health: "descriptive", armorClass: false,
 ability: false, conditions: true, revealedMoves: [],
}
export type PrivateEnemy = {
 id: string; name: string; artwork?: string; types: readonly string[];
 hp: number; maxHp: number; ac: number; ability: string;
 conditions: readonly string[]; moves: readonly string[];
 abilityScores: readonly number[]; notes: string; hidden: boolean;
}
export type PublicEnemy = {
 id: string; name: string; artwork?: string; types?: readonly string[];
 health?: EnemyHealth; hp?: number; maxHp?: number; ac?: number;
 ability?: string; conditions?: readonly string[]; moves?: readonly string[];
}
export function healthDescription(hp: number, maxHp: number): EnemyHealth {
 if (hp <= 0) return "fainted"
 const ratio = hp / Math.max(1, maxHp)
 return ratio >= 1 ? "uninjured" : ratio > .75 ? "lightly injured" :
  ratio > .5 ? "injured" : ratio > .25 ? "wounded" : "critically wounded"
}
export function projectEnemy(enemy: PrivateEnemy, visibility: Visibility): PublicEnemy | null {
 if (enemy.hidden) return null
 const result: PublicEnemy = { id: enemy.id, name: visibility.identity ? enemy.name : "Unknown Pokémon" }
 if (visibility.identity && enemy.artwork) result.artwork = enemy.artwork
 if (visibility.typing) result.types = [...enemy.types]
 if (visibility.health !== "hidden") result.health = healthDescription(enemy.hp, enemy.maxHp)
 if (visibility.health === "exact") { result.hp = enemy.hp; result.maxHp = enemy.maxHp }
 if (visibility.armorClass) result.ac = enemy.ac
 if (visibility.ability) result.ability = enemy.ability
 if (visibility.conditions) result.conditions = [...enemy.conditions]
 const moves = enemy.moves.filter(move => visibility.revealedMoves.includes(move))
 if (moves.length) result.moves = moves
 return result
}
