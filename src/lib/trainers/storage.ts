export type PokemonStorage = "party" | "box"
export type StoredPokemon = { id: string, storage?: PokemonStorage }

export function locationOf(pokemon: StoredPokemon): PokemonStorage {
	return pokemon.storage === "box" ? "box" : "party"
}
export function inStorage<T extends StoredPokemon>(pokemon: readonly T[], storage: PokemonStorage): T[] {
	return pokemon.filter(p => locationOf(p) === storage)
}
export function relocatePokemon<T extends StoredPokemon>(pokemon: readonly T[], id: string, storage: PokemonStorage): T[] {
	const selected = pokemon.find(p => p.id === id)
	if (!selected || locationOf(selected) === storage) return [...pokemon]
	return [...pokemon.filter(p => p.id !== id), { ...selected, storage }]
}
export function reorderStorage<T extends StoredPokemon>(pokemon: readonly T[], storage: PokemonStorage, from: number, to: number): T[] {
	const selected = inStorage(pokemon,storage)
	if (!Number.isInteger(from) || !Number.isInteger(to) || from<0 || to<0 || from>=selected.length || to>=selected.length || from===to) return [...pokemon]
	const [moved] = selected.splice(from,1)
	selected.splice(to,0,moved)
	let index = 0
	return pokemon.map(p => locationOf(p) === storage ? selected[index++] : p)
}
