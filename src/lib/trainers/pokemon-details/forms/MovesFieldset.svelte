<script lang="ts">
	import type { Attribute } from "$lib/dnd/attributes"
	import type { Level } from "$lib/dnd/level"
	import { LearnableMoves } from "$lib/moves/LearnableMoves"
	import type { Move } from "$lib/moves/Move"
	import MoveEditor, { getMoveFieldName } from "$lib/moves/MoveEditor.svelte"
	import { MoveFilter } from "$lib/moves/MoveFilter"
	import { MoveSearchAndFilter } from "$lib/moves/form"
	import { LearnedMove } from "$lib/moves/learned"
	import { MovesStore } from "$lib/moves/store"
	import type { PokemonSpecies } from "$lib/poke5e/species"
	import { MoveOption } from "$lib/pokemon/move-pool"
	import { FeatureToggles } from "$lib/site/FeatureToggles"
	import { m } from "$lib/site/i18n"
	import { recommendMoves } from "$lib/poke5e/automation/MoveSuggestions"
	import type { PokeType } from "$lib/pokemon/types"
	import { Button, Details, VisuallyHidden } from "$lib/ui/elements"
	import { Fieldset, focusInputField, InstructionText } from "$lib/ui/forms"

	const PAGE_SIZE = 30

	export let values: LearnedMove[]
	export let species: PokemonSpecies
	export let level: Level
	export let disabled: boolean
	export let chosenTypes: readonly PokeType[] = []

	let newMoveId = -1001
	const nextNewMoveId = () => (--newMoveId).toString()

	const removeMove = (id: string) => () => {
		values = values.filter((it) => it.id !== id)
	}

	const addMove = () => {
		const newMove = species?.moves?.data?.start?.[0] ?? "tackle"
		const pp = $MovesStore.result?.find((it) => it.id === newMove)?.pp ?? 20
		const nextId = nextNewMoveId()

		values = [...values, LearnedMove.create({
			id: nextId,
			moveId: newMove,
			pp: pp,
		})]

		focusInputField(getMoveFieldName(nextId))
	}

	const addSpecificMove = (move: Move) => () => {
		if (disabled || values.some(value => value.moveId === move.id)) return
		const nextId = nextNewMoveId()

		values = [...values, LearnedMove.create({
			id: nextId,
			moveId: move.id,
			pp: move.pp,
		})]
	}

	let moveNameFilter = ""
	let moveTypeFilter = ""
	let movePowerFilter = ""
	$: moveFilter = new MoveFilter()
		.name(moveNameFilter)
		.type(moveTypeFilter)
		.power(movePowerFilter as Attribute)
	$: filteredMoves = ($MovesStore.result ?? []).filter(moveFilter.apply)
	$: learnableMoves = LearnableMoves.groupMoves(filteredMoves, species, level)

	let libraryMode: "recommended" | "all" = "recommended"
	let page = 1
	const setLibrary = (mode: "recommended" | "all") => { libraryMode = mode; page = 1 }
	$: suggestions = recommendMoves(filteredMoves,
		species.moves.availableAtLevel(level),
		[...(species.moves.level2 ?? []), ...(species.moves.level6 ?? []), ...(species.moves.level10 ?? []), ...(species.moves.level14 ?? []), ...(species.moves.level18 ?? [])],
		chosenTypes, values.map(move => move.moveId))
	$: allGroups = learnableMoves.nonemptyGroups()
	$: allEntries = allGroups.flatMap(group => group.moves.map(move => ({ move, group: group.name })))
	$: uniqueEntries = allEntries.filter((entry, index) => allEntries.findIndex(other => other.move.id === entry.move.id) === index)
	$: visibleEntries = libraryMode === "recommended" ? suggestions.map(suggestion => ({ move: suggestion.move, group: suggestion.reason })) : uniqueEntries
	$: totalPages = Math.max(1, Math.ceil(visibleEntries.length / PAGE_SIZE))
	$: currentPage = Math.min(page, totalPages)
	$: pageEntries = visibleEntries.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE)

	const replaceMove = (updated: LearnedMove) => {
		values = values.map((it) => it.id === updated.id ? { ...updated } : it)
	}
</script>

<Fieldset title="{m.moves()}">
	{#if FeatureToggles.MoveCustomization.isActive()}
		<div>
			<p><strong>Known Moves</strong></p>
			{#if values.length === 0}
				<InstructionText>No known moves yet. Tap "Show Add Moves" below to reveal a list of moves you can learn. Use the "+" button to add the move!</InstructionText>
			{/if}
			<div class="move-list">
				{#each values as move, index (move.id)}
					<MoveEditor bind:value={values[index]} {species} {disabled} onremove={removeMove(move.id)} onchange={replaceMove} {level} />
				{/each}
			</div>
		</div>
		<hr />
		<div>
			<Details title="Add Moves">
				<MoveSearchAndFilter
					idPrefix="moves-to-add"
					label={m.findMoveToAdd()}
					matches={filteredMoves.length}
					bind:nameFilter={moveNameFilter}
					bind:typeFilter={moveTypeFilter}
					bind:powerFilter={movePowerFilter}
					{disabled}
				/>
				<div class="library-modes">
					<button type="button" aria-pressed={libraryMode === "recommended"} on:click={() => setLibrary("recommended")}>Suggested moves</button>
					<button type="button" aria-pressed={libraryMode === "all"} on:click={() => setLibrary("all")}>All moves</button>
				</div>
				<p class="smaller">Suggestions update with level, species and selected types. Type matches outside the species pool are optional homebrew, not automatic unlocks. TM and egg requirements still apply.</p>
				<p>{visibleEntries.length} results · page {currentPage} of {totalPages}</p>
				{#if !pageEntries.length}<p>No matching moves. Try All moves or change the filters.</p>{/if}
				<div class="move-list">
					{#each pageEntries as entry (entry.move.id)}
						{@const isAdded = values.some(it => it.moveId === entry.move.id)}
						<div>
							<small>{entry.group}</small>
							<MoveOption idPrefix="moves-to-add" value={entry.move}>
								<Button variant={isAdded ? "subtle" : "success"} disabled={disabled || isAdded} on:click={addSpecificMove(entry.move)}>{isAdded ? "Added" : "+ Add"}</Button>
							</MoveOption>
						</div>
					{/each}
				</div>
				<div class="library-modes">
					<button type="button" disabled={currentPage <= 1} on:click={() => page = currentPage-1}>Previous</button>
					<button type="button" disabled={currentPage >= totalPages} on:click={() => page = currentPage+1}>Next</button>
				</div>
			</Details>
		</div>
	{:else}
		{#each values as move (move.id)}
			<MoveEditor
				value={move}
				{species}
				{disabled}
				onremove={removeMove(move.id)}
				onchange={replaceMove}
				{level}
			/>
			<hr />
		{/each}
		<Button on:click={addMove}>{m.addMove()}</Button>
	{/if}

</Fieldset>

<style>
	hr {
		grid-column: span 2;
		margin: 0.25em auto;
		background: none;
		border: none;
		border-block-end: 0.0625em dotted var(--skin-bg);
	}

	.library-modes { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 0.5rem; }
	.library-modes button { min-height: 44px; }
	.library-modes button[aria-pressed="true"] { font-weight: bold; outline: 2px solid currentColor; }

	.move-list {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.smaller { font-size: var(--font-sz-venus); }
</style>