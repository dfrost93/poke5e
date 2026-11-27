<script lang="ts">
	import { LearnedMovesListInfo, type LearnedMove } from "$lib/moves/learned"
	import { MovesStore } from "$lib/moves/store"
	import { Loader } from "$lib/ui/elements"
	import { createEventDispatcher } from "svelte"
	import type { TrainerPokemon, TrainerInfo } from "../types"
	import { noEffects, type Effect } from "$lib/poke5e/automation/ActiveEffects"

	const dispatch = createEventDispatcher()

	export let effects: readonly Effect[] = noEffects
	export let pokemon: TrainerPokemon
	export let trainer: TrainerInfo | undefined = undefined
	export let editable: boolean = false

	const onUpdate = (move: LearnedMove) => {
		dispatch("update", { ...move } as LearnedMove)
	}
</script>

{#if pokemon.moves.length > 0}
	{#if $MovesStore.result}
		<h2>Moves</h2>
		<LearnedMovesListInfo {pokemon} {trainer} {effects} {editable} onupdate={onUpdate} />
	{:else}
		<Loader />
	{/if}
{/if}
