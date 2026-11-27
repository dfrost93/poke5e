<script lang="ts">
	import { Saveable, SearchField } from "$lib/ui/forms"
	import { filterValue, pokemonTagFilter } from "../store"
	import type { TrainerStore } from "../trainers"
	import type { PokemonId, TrainerPokemon } from "../types"
	import { Button } from "$lib/ui/elements"
	import PokemonSummary from "./PokemonSummary.svelte"
	import { ListHeading } from "$lib/ui/page"
	import { Url } from "$lib/site/url"
	import { m } from "$lib/site/i18n"
	import type { ReorderListChangeEventDetail } from "@auroratide/reorder-list/lib/events"
	import { inStorage, locationOf, reorderStorage, type PokemonStorage } from "../storage"
	import { TagFilter, TagList, TagSelection } from "$lib/poke5e/tags"

	export let trainer: TrainerStore
	export let currentPokemon: PokemonId | undefined
	export let isFullList: boolean = false

	$: editable = $trainer.update != null
	let tab: PokemonStorage = "party"
	let moving: string | null = null
	let moveError = ""
	$: party = inStorage($trainer.pokemon,"party")
	$: box = inStorage($trainer.pokemon,"box")
	$: tabPokemon = tab === "party" ? party : box
	let selectedTrainer = ""
	$: if (selectedTrainer !== $trainer.info.readKey) { selectedTrainer = $trainer.info.readKey; tab = "party" }
	let selectedPokemon: string | undefined
	$: if (currentPokemon !== selectedPokemon) { selectedPokemon = currentPokemon; const current = $trainer.pokemon.find(p=>p.id===currentPokemon); if(current) tab = locationOf(current) }
	const movePokemon = async (id: string, target: PokemonStorage) => {
		if (moving || reordering || !$trainer.update) return
		moving = id; moveError = ""
		try { await $trainer.update.setStorage(id,target) } catch { moveError = "Unable to move Pokémon. Please retry." } finally { moving = null }
	}
	$: pokemonTags = $trainer.tags.getForPokemon()

	$: textFilterIsTagName = TagList.has(pokemonTags, $filterValue)

	const byNicknameOrSpecies = (filterValue: string) => (it: TrainerPokemon) => textFilterIsTagName || 
		it.nickname.toLocaleLowerCase().includes(filterValue) || it.pokemonId.data.replace("-", " ").includes(filterValue)

	$: filteredTags = TagFilter.applicable($pokemonTagFilter, pokemonTags)
	$: filteredTagsWithSearch = textFilterIsTagName ? filteredTags.concat([$filterValue]) : filteredTags

	$: filtered = tabPokemon
		.filter(TagList.filterBy(filteredTagsWithSearch, $pokemonTagFilter.mode))
		.filter(byNicknameOrSpecies($filterValue.toLocaleLowerCase()))
	$: baseTrainerUrl = Url.trainers($trainer.info.readKey)

	$: canReorder = editable && !moving && !$filterValue && filteredTags.length === 0 && filtered.length === tabPokemon.length
	let reordering = false
	const onReorder = (e: CustomEvent<ReorderListChangeEventDetail>) => {
		if (!canReorder || reordering || e.detail.oldIndex === e.detail.newIndex) return

		reordering = true
		const newList = reorderStorage($trainer.pokemon,tab,e.detail.oldIndex,e.detail.newIndex)
		$trainer.update?.reorderTeam(newList).finally(() => {
			reordering = false
		})
	}

	const resetFilters = () => {
		TagFilter.reset(pokemonTagFilter)
	}
</script>

<ListHeading title="{$trainer.info.name}'s Pokemon" target="/trainers">
	<span slot="link">
		{#if currentPokemon || isFullList}
			<a href="{baseTrainerUrl}" class="dark-font">{m.viewTrainerProfile()} &gt;</a>
		{:else}
			<a href="{Url.trainers()}" class="dark-font">{m.seeTrainerList()} &gt;</a>
		{/if}
	</span>
	<span slot="action" style:visibility={editable ? "visible" : "hidden"} style:display="flex">
		<Button href="{baseTrainerUrl}&action=add-pokemon">+ {m.addPokemon()}</Button>
	</span>
</ListHeading>
<div class="storage-tabs" role="group" aria-label="Pokémon storage">
	<button type="button" aria-pressed={tab === "party"} on:click={()=>tab="party"}>Party ({party.length})</button>
	<button type="button" aria-pressed={tab === "box"} on:click={()=>tab="box"}>PC Storage ({box.length})</button>
</div>
<p class="storage-note">{tab === "party" ? "Active team. Standard party size is six; larger homebrew parties are allowed." : "Stored Pokémon retain their character sheets, items, moves and health."}</p>
{#if moveError}<p role="alert">{moveError}</p>{/if}
<div class="space-bottom">
	<SearchField id="filter-pokemon" label="Search" bind:value={$filterValue} matched={filtered.length} max={tabPokemon.length} activeFilters={filteredTags.length > 0 ? 1 : 0} on:reset={resetFilters}>
		<TagSelection bind:checked={$pokemonTagFilter.tags} bind:mode={$pokemonTagFilter.mode} tags={pokemonTags} />
	</SearchField>
</div>
<div class="relative"><!-- Needed for the > indicators to appear outside the scroll box -->
	<div class="scrollable">
		{#if !filtered.length}<p>{tab === "box" ? "No matching stored Pokémon." : "No matching party Pokémon."}</p>{/if}
		{#if canReorder}
			<Saveable saving={reordering}>
				<reorder-list class="nolist no-space full-width" on:commit={onReorder}>
					{#each filtered as p (p.id)}
						<reorder-item class="space-after">
							<PokemonSummary trainer={$trainer.info.readKey} pokemon={p} editable />
							<button class="storage-action" type="button" disabled={!!moving || reordering} on:click={()=>movePokemon(p.id,tab==="party"?"box":"party")}>{tab==="party"?"Deposit to PC":"Withdraw to party"}</button>
						</reorder-item>
					{/each}
				</reorder-list>
			</Saveable>
		{:else}
			<ul class="nolist no-space full-width">
				{#each filtered as p (p.id)}
					<li class="space-after">
						<PokemonSummary trainer={$trainer.info.readKey} pokemon={p} />
						{#if editable}<button class="storage-action" type="button" disabled={!!moving || reordering} on:click={()=>movePokemon(p.id,tab==="party"?"box":"party")}>{tab==="party"?"Deposit to PC":"Withdraw to party"}</button>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.storage-tabs { display:flex; gap:.5rem; margin-block:.5rem; }
	.storage-tabs button { flex:1; min-height:44px; }
	.storage-tabs button[aria-pressed="true"] { font-weight:bold; outline:2px solid currentColor; }
	.storage-action { min-height:44px; margin:.25rem .5rem; }
	.storage-note { font-size:.85em; margin-block:.25rem; }
	.space-bottom {
		margin-bottom: 0.5em;
	}

	.dark-font {
		color: var(--skin-content-text);
	}

	.no-space {
		margin: 0;
	}

	.scrollable {
		height: 100%;
		overflow: auto;
	}

	.space-after {
		margin-bottom: 0.5em;
	}

	.full-width {
		width: 100%;
	}

	.relative {
		position: relative;
		height: 0;
		flex: 1;
	}
</style>