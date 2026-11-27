<script lang="ts">
	import type { TrainerPokemon } from "../types"
	import { FlatDl } from "$lib/ui/elements"
	import { DistancesDlItem } from "$lib/dnd/distance"
	import { TeraTypeTag } from "$lib/pokemon/types"
	import type { PokemonSpecies } from "$lib/poke5e/species"
	import { m } from "$lib/site/i18n"
	import { currentEdition } from "$lib/site/edition"
	import { Speeds } from "$lib/dnd/movement"
	import { totalModifier, noEffects, type Effect } from "$lib/poke5e/automation/ActiveEffects"
	import InitiativeRoll from "$lib/poke5e/automation/InitiativeRoll.svelte"
	import { characterInitiative, effectiveArmorClass, standardItemIds } from "$lib/poke5e/automation/SheetRules"

	export let effects: readonly Effect[] = noEffects
	export let pokemon: TrainerPokemon
	export let species: PokemonSpecies

	$: pb = pokemon.level.proficiencyBonus
	$: baseSpeeds = species.speed.mergeWith(pokemon.speeds)
	$: speeds = new Speeds(Object.fromEntries(Object.entries(baseSpeeds.data).map(([key, value]) => [key, value != null && value > 0 ? Math.max(0, value + totalModifier(effects, "speed")) : value])))
	$: initiative = characterInitiative($currentEdition, pokemon, standardItemIds(pokemon)) + totalModifier(effects, "initiative")
	$: senses = species.senses.mergeWith(pokemon.senses)
</script>

<FlatDl columns={2}>
	<dt><abbr title="{m.armorClass()}">{m.ac()}</abbr></dt>
	<dd>{effectiveArmorClass($currentEdition, pokemon.ac, standardItemIds(pokemon))}</dd>
	<dt>{m.nature()}</dt>
	<dd class="cap">{pokemon.nature.data}</dd>
	<dt>{m.sr()}</dt>
	<dd>{species.sr.toString()}</dd>
	<dt>{m.size()}</dt>
	<dd class="cap">{pokemon.customSize ?? species.data.size}</dd>
	<dt>{m.bonus()}</dt>
	<dd>+{pb}</dd>
	<DistancesDlItem label="{m.speed()}" values={speeds} />
	<DistancesDlItem label="{m.senses()}" values={senses} />
	{#if pokemon.teraType != null}
		<dt>{m.tera()}</dt>
		<dd><TeraTypeTag type={pokemon.teraType} /></dd>
	{/if}
</FlatDl>
<InitiativeRoll bonus={initiative} />
