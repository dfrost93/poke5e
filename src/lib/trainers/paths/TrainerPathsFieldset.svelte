<script lang="ts">
	import { TrainerPaths } from "./2024"
	import { Fieldset, SelectField, SelectFieldOther } from "$lib/ui/forms"
	import PathFeatureFields from "./PathFeatureFields.svelte"
	import type { ChosenTrainerPath } from "./ChosenTrainerPath"
	import { isStandardTrainerPath } from "./TrainerPath"
	import { m } from "$lib/site/i18n"
	import { Markdown } from "$lib/ui/rendering"

	export let value: ChosenTrainerPath
	export let disabled: boolean = false

	let path = value.name === "" || isStandardTrainerPath(value.name) ? value.name : SelectFieldOther
	let pathCustom = value.name
	$: selected = TrainerPaths.find(option => option.name === path)

	$: {
		if (path === SelectFieldOther) {
			value.name = pathCustom
		} else {
			value.name = path
		}
	}

	const options = [ {
		name: "— None —",
		value: "",
	} ].concat(TrainerPaths.map((path) => ({
		name: path.name,
		value: path.name,
	})))
</script>

<Fieldset title="{m.trainerPath()}">
	<SelectField label="{m.pathName()}" {options} bind:value={path} bind:other={pathCustom} {disabled} />
	{#if selected}
		<details open><summary>{selected.name} features</summary>
			{#each [2, 5, 9, 15] as level}
				{@const feature = selected.features[`level${level}` as keyof typeof selected.features]}
				<h4>Level {level}</h4>
				{#each feature.description as description}<Markdown value={description} />{/each}
			{/each}
		</details>
	{/if}
	{#if path === SelectFieldOther}
		<hr />
		<PathFeatureFields level="2" bind:description={value.customFeatures.level2.description} {disabled} />
		<PathFeatureFields level="5" bind:name={value.customFeatures.level5.name} bind:description={value.customFeatures.level5.description} {disabled} />
		<PathFeatureFields level="9" bind:name={value.customFeatures.level9.name} bind:description={value.customFeatures.level9.description} {disabled} />
		<PathFeatureFields level="15" bind:name={value.customFeatures.level15.name} bind:description={value.customFeatures.level15.description} {disabled} />
	{/if}
</Fieldset>
