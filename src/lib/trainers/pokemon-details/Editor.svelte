<script lang="ts" context="module">
	export type UpdateDetail = {
		pokemon: TrainerPokemon,
		updateAvatar?: ImageInputValue,
	}
</script>

<script lang="ts">
	import { Button } from "$lib/ui/elements"
	import { ActionArea, Form, FormDetails, MarkdownField, type ImageInputValue, Fieldset } from "$lib/ui/forms"
	import { AttributesFieldset, AttributeCheckboxFields } from "$lib/dnd/attributes"
	import { ProficienciesFieldset } from "$lib/dnd/skills"
	import { createEventDispatcher } from "svelte"
	import { type TrainerPokemon } from "../types"
	import BasicInfoFieldset from "./forms/BasicInfoFieldset.svelte"
	import HeldItemsFieldset from "./forms/HeldItemsFieldset.svelte"
	import MovesFieldset from "./forms/MovesFieldset.svelte"
	import { FeatsFieldset } from "$lib/dnd/feats"
	import { DndAndPokemonFeats } from "$lib/poke5e/feats/PokemonFeats"
	import CustomBasicInfoFieldset from "./forms/CustomBasicInfoFieldset.svelte"
	import { SensesFieldset } from "$lib/dnd/senses"
	import BondFieldset from "$lib/pokemon/bond/BondFieldset.svelte"
	import { Level } from "$lib/dnd/level"
	import { SpeedsFieldset } from "$lib/dnd/movement"
	import { PokemonTeraType, TypeField, type TeraType } from "$lib/pokemon/types"
	import { GenderFieldset } from "$lib/pokemon/gender"
	import { HitDice } from "$lib/dnd/hit-dice"
	import type { PokemonSpecies } from "$lib/poke5e/species"
	import { m } from "$lib/site/i18n"
	import { Resource } from "$lib/poke5e/resource"
	import { StabFieldset } from "$lib/pokemon/stab"
	import { KnownAbilitiesFieldset } from "$lib/pokemon/ability"
	import { TagList, TagListField } from "$lib/poke5e/tags"
	import { currentEdition } from "$lib/site/edition"
	import { featChanges, pokemonLimits, adjustTireless } from "$lib/poke5e/automation/BuilderRules"
	import { calculateSheetMove, characterInitiative, effectiveArmorClass, standardItemIds } from "$lib/poke5e/automation/SheetRules"
	import { MovesStore } from "$lib/moves/store"
	import { MoveStatsInfo } from "$lib/moves"

	const dispatch = createEventDispatcher()

	export let pokemon: TrainerPokemon
	export let species: PokemonSpecies
	export let saving: boolean = false
	export let pokemonTags: TagList
	$: disabled = saving

	let nickname = pokemon.nickname
	let nature = pokemon.nature.copy()
	let tera = pokemon.teraType?.copy() ?? new PokemonTeraType("" as TeraType) // deal with undefined teras on older pokemon
	let level = pokemon.level.data
	let ac = pokemon.ac
	let maxHp = pokemon.hp.max
	let maxHitDice = pokemon.hitDice.max
	let gender = pokemon.gender
	let attributes = pokemon.attributes.copy()
	let abilities = pokemon.abilities.map(ability => ability.copy())
	let proficiencies = pokemon.proficiencies.copy()
	let savingThrows = [...pokemon.savingThrows]
	let notes = pokemon.notes
	let type = pokemon.type.copy()
	let isShiny = pokemon.isShiny
	let feats = pokemon.feats.map((it) => structuredClone(it))
	let customSize = pokemon.customSize
	let customHitDiceSize = pokemon.customHitDiceSize?.data
	let speeds = pokemon.speeds.copy()
	let senses = pokemon.senses.copy()
	let bond = structuredClone(pokemon.bond)
	let stab = pokemon.stab.copy()
	let originalAvatar = pokemon.avatar
	let avatarToUpload: ImageInputValue | undefined = undefined
	let isValid = true
	let tags = TagList.copy(pokemon.tags)

	let moves = structuredClone(pokemon.moves)
	let items = structuredClone(pokemon.items)
	let applyBonuses = true
	let removeBakedFeats = false
	const originalFeats = structuredClone(pokemon.feats)
	const originalMoves = structuredClone(pokemon.moves)
	$: acquired = featChanges(originalFeats,feats,level,$currentEdition,removeBakedFeats,applyBonuses)
	$: limits = pokemonLimits(feats,$currentEdition)
	$: previewMoves = adjustTireless(originalFeats,feats,originalMoves,moves,removeBakedFeats,applyBonuses)
	$: preview = { ...pokemon, attributes, type, level: new Level(level), abilities, feats, items, stab, ac: Math.max(0,ac+acquired.ac), hp: Resource.adjustMax(pokemon.hp,Math.max(0,maxHp+acquired.hp)), moves: previewMoves }
	$: previewAC = effectiveArmorClass($currentEdition,preview.ac,standardItemIds(preview))
	$: previewInitiative = characterInitiative($currentEdition,preview,standardItemIds(preview))

	const cancel = () => {
		dispatch("cancel")
	}

	const endEdit = () => {
		dispatch("update", {
			pokemon: {
				...pokemon,
				nickname: nickname.length > 0 ? nickname : species.data.name,
				type,
				nature: nature,
				teraType: tera,
				level: new Level(level),
				ac: preview.ac,
				hp: preview.hp,
				hitDice: Resource.adjustMax(pokemon.hitDice, maxHitDice),
				gender,
				isShiny,
				attributes,
				ability: undefined,
				abilities,
				proficiencies,
				savingThrows,
				moves: previewMoves,
				items,
				notes,
				feats,
				customSize,
				customHitDiceSize: customHitDiceSize ? new HitDice(customHitDiceSize) : undefined,
				speeds,
				senses,
				bond: {
					...bond,
					points: Resource.adjustMax(pokemon.bond.points, bond.points.max),
				},
				stab,
				tags,
				avatar: originalAvatar,
			},
			updateAvatar: avatarToUpload,
		} as UpdateDetail)
	}
</script>

<Form onsubmit={endEdit} {saving}>
	<BasicInfoFieldset bind:nickname bind:nature bind:tera={tera} bind:level bind:ac bind:maxHp bind:maxHitDice bind:isShiny originalAvatarSrc={originalAvatar?.href} bind:avatar={avatarToUpload} bind:isValid {disabled} />
	<GenderFieldset bind:value={gender} {disabled} />
	<AttributesFieldset bind:values={attributes} {disabled} />
	<KnownAbilitiesFieldset bind:values={abilities} {species} {disabled} />
	<BondFieldset bind:value={bond} {disabled} />
	<ProficienciesFieldset bind:values={proficiencies} {disabled} />
	<AttributeCheckboxFields label={m.savingThrows()} bind:values={savingThrows} {disabled} />
	<Fieldset title="Pokémon typing"><TypeField bind:value={type.data} {disabled} /></Fieldset>
	<MovesFieldset bind:values={moves} {species} chosenTypes={type.data} level={new Level(level)} {disabled} />
	<FeatsFieldset feats={$DndAndPokemonFeats} bind:values={feats} {disabled} />
	<HeldItemsFieldset bind:items {disabled} />
	<Fieldset title="Live mechanical review">
		<label><input type="checkbox" bind:checked={applyBonuses} {disabled} /> Apply new supported permanent bonuses (AC Up, Tough and Tireless)</label>
		<label><input type="checkbox" bind:checked={removeBakedFeats} disabled={disabled || !applyBonuses} /> Subtract removed supported bonuses if already included in saved stats</label>
		<p>AC {previewAC} · HP {preview.hp.max} · Initiative {previewInitiative >= 0 ? "+" : ""}{previewInitiative}</p>
		<p>Known moves: {moves.length} / {limits.moves} · Held items: {items.length} / {limits.heldItems}</p>
		{#if moves.length > limits.moves || items.length > limits.heldItems}<p><strong>Above normal rules limits.</strong> Homebrew overrides are allowed.</p>{/if}
		{#if acquired.ac || acquired.hp}<p>New feat changes: AC {acquired.ac >= 0 ? "+" : ""}{acquired.ac}, HP {acquired.hp >= 0 ? "+" : ""}{acquired.hp}</p>{/if}
		<p>Preview includes this Pokémon's supported features, not its trainer's path, specializations or temporary combat effects. Disable acquisition automation if you added the bonuses manually.</p>
		{#each previewMoves as learned (learned.id)}
			{@const move = $MovesStore.result?.find(option => option.id === learned.moveId)}
			{#if move}
				{@const calculated = calculateSheetMove($currentEdition,move,learned,preview)}
				<div><strong>{move.name}</strong> · PP {learned.pp.current}/{learned.pp.max}<MoveStatsInfo value={calculated.stats} />{#if calculated.notes.length}<small>{calculated.notes.join(" · ")}</small>{/if}</div>
			{/if}
		{/each}
	</Fieldset>
	<Fieldset title="{m.general()}">
		<MarkdownField label="{m.notes()}" bind:value={notes} placeholder="{m.generalNotesPlaceholder()}" {disabled} />
		<TagListField label="{m.tags()}" bind:value={tags} possibleTags={pokemonTags} />
	</Fieldset>
	<FormDetails title="Advanced">
		<CustomBasicInfoFieldset bind:customSize bind:customHitDiceSize {disabled} />
		<SpeedsFieldset bind:values={speeds} {disabled} />
		<SensesFieldset bind:values={senses} {disabled} />
		<StabFieldset bind:value={stab} {disabled} />
	</FormDetails>
	<ActionArea error={!isValid ? m.oneOrMoreFieldsAboveHaveAnIssue() : undefined}>
		<Button on:click={cancel} variant="subtle" {disabled}>{m.cancel()}</Button>
		<Button type="submit" disabled={disabled || !isValid}>{m.finish()}</Button>
	</ActionArea>
</Form>
