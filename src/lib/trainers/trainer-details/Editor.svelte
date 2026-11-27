<script lang="ts" context="module">
	export type UpdateDetail = {
		trainer: TrainerInfo,
		updateAvatar?: ImageInputValue,
	}
</script>

<script lang="ts">
	import type { Trainer, TrainerInfo } from "../types"
	import { createEventDispatcher } from "svelte"
	import {
		Form,
		Fieldset,
		MarkdownField,
		ActionArea,
		type ImageInputValue,
		FormDetails,
	} from "$lib/ui/forms"
	import BasicInfoFieldset from "./forms/BasicInfoFieldset.svelte"
	import BiographyFieldset from "./forms/BiographyFieldset.svelte"
	import { AttributesFieldset, AttributeCheckboxFields } from "$lib/dnd/attributes"
	import { ProficienciesFieldset } from "$lib/dnd/skills"
	import InventoryFieldset from "./forms/InventoryFieldset.svelte"
	import { Button } from "$lib/ui/elements"
	import { SpecializationsFieldset } from "../specializations"
	import { TrainerPathsFieldset } from "../paths"
	import { FeatsFieldset } from "$lib/dnd/feats"
	import { DndFeats } from "$lib/dnd/feats"
	import { Level } from "$lib/dnd/level"
	import { m } from "$lib/site/i18n"
	import { Resource } from "$lib/poke5e/resource"
	import { TagList, TagListField } from "$lib/poke5e/tags"
	import { trainers } from "../trainers"
	import { HitDice, HitDiceField } from "$lib/dnd/hit-dice"
	import { currentEdition } from "$lib/site/edition"
	import { characterInitiative } from "$lib/poke5e/automation/SheetRules"
	import { AttributeBlock } from "$lib/dnd/attributes"
	import SkillsInfo from "../info/SkillsInfo.svelte"
	import { TrainerPaths } from "../paths/2024"
	import { SpecializationList as SpecializationList2024 } from "../specializations/2024/SpecializationList"
	import { featChanges, specializationChanges } from "$lib/poke5e/automation/BuilderRules"
	import AbilityScoreBuilder from "$lib/poke5e/automation/AbilityScoreBuilder.svelte"

	const allTags = trainers.tags()
	
	const dispatch = createEventDispatcher()

	export let trainer: Trainer
	export let saving: boolean = false
	$: disabled = saving

	let name = trainer.name
	let level = trainer.level.data
	let ac = trainer.ac
	let maxHp = trainer.hp.max
	let maxHitDice = trainer.hitDice.max
	let attributes = trainer.attributes.copy()
	let proficiencies = trainer.proficiencies.copy()
	let savingThrows = [...trainer.savingThrows]
	let description = trainer.description
	let biography = structuredClone(trainer.biography)
	let originalAvatar = trainer.avatar
	let money = trainer.money
	let specializations = structuredClone(trainer.specializations)
	let trainerPath = structuredClone(trainer.path)
	let feats = trainer.feats.map((it) => structuredClone(it))
	let avatarToUpload: ImageInputValue | undefined = undefined
	let isValid = true
	let tags = TagList.copy(trainer.tags)
	let hitDiceSize = trainer.customHitDiceSize?.data
	let token = structuredClone(trainer.token)

	let inventory = structuredClone(trainer.inventory)
	let step = 0
	let applyBonuses = true
	let removeBakedFeats = false
	const originalFeats = structuredClone(trainer.feats)
	const originalSpecializations = structuredClone(trainer.specializations)
	const steps = ["Identity", "Ability scores", "Skills & saves", "Path & specialties", "Feats", "Equipment & notes", "Review"]
	const hints = ["Choose your trainer’s name, level, health and background.", "Set the six base ability scores using your campaign’s chosen method.", "Choose proficiencies, expertise and saving throw proficiencies.", "Choose a path and specialties. New 2024 specialty ranks apply their fixed ability score or skill bonus in the review.", "Read feat rules before selecting. Supported newly acquired bonuses are calculated in the review.", "Choose items, money, biography notes and optional settings. Inventory is not automatically equipped.", "Review derived stats and your selections before saving."]
	$: previewLevel = new Level(level)
	$: acquired = featChanges(originalFeats,feats,level,$currentEdition,removeBakedFeats,applyBonuses)
	$: specialty = specializationChanges(attributes,proficiencies,originalSpecializations,specializations,Object.values(SpecializationList2024),applyBonuses && $currentEdition === "2024")
	$: preview = { ...trainer, name, level: previewLevel, attributes: specialty.attributes, proficiencies: specialty.proficiencies, savingThrows, feats, path: trainerPath, specializations, ac: Math.max(0,ac+acquired.ac), hp: Resource.adjustMax(trainer.hp,Math.max(0,maxHp+acquired.hp)) }
	$: reducedSpecialties = Object.keys(originalSpecializations).some(key => (specializations[key as keyof typeof specializations] ?? 0) < (originalSpecializations[key as keyof typeof originalSpecializations] ?? 0))
	$: initiative = characterInitiative($currentEdition, preview)
	const goTo = (index: number) => { if (!disabled) step = Math.max(0, Math.min(steps.length-1,index)) }

	const cancel = () => {
		dispatch("cancel")
	}
	const endEdit = () => {
		if (step !== steps.length-1 || disabled || !isValid || !name.trim()) return
		const selectedPath = TrainerPaths.find(path => path.name === trainerPath.name)
		const cap = selectedPath?.resource && level >= selectedPath.resource.acquiredAtLevel ? selectedPath.resource.max(preview) : 0
		const pathToSave = selectedPath ? { ...trainerPath, resource: trainerPath.name !== trainer.path.name ? cap : Math.min(cap, Math.max(0,trainerPath.resource)) } : trainerPath
		dispatch("update", {
			trainer: {
				name,
				description,
				level: new Level(level),
				ac: preview.ac,
				hp: preview.hp,
				hitDice: Resource.adjustMax(trainer.hitDice, maxHitDice),
				attributes: preview.attributes,
				proficiencies: preview.proficiencies,
				savingThrows,
				biography,
				money,
				inventory,
				avatar: originalAvatar,
				specializations,
				path: pathToSave,
				feats,
				tags,
				customHitDiceSize: hitDiceSize ? new HitDice(hitDiceSize) : undefined,
				token,
			},
			updateAvatar: avatarToUpload,
		})
	}
</script>

<Form onsubmit={endEdit} {saving}>
	<nav aria-label="Trainer builder steps" class="steps">
		{#each steps as label, index}
			<button type="button" aria-current={step === index ? "step" : undefined} disabled={disabled} on:click={() => goTo(index)}>{index+1}. {label}</button>
		{/each}
	</nav>
	<h2>Step {step+1} of {steps.length}: {steps[step]}</h2>
	<p>{hints[step]}</p>
	<section hidden={step !== 0}><BasicInfoFieldset bind:name bind:level bind:ac bind:maxHp bind:maxHitDice {disabled} />
	<BiographyFieldset bind:biography bind:avatar={avatarToUpload} bind:token bind:isValid originalAvatarSrc={originalAvatar?.href} {disabled} /></section>
	<section hidden={step !== 1}><AbilityScoreBuilder bind:attributes {disabled} /><AttributesFieldset bind:values={attributes} {disabled} /></section>
	<section hidden={step !== 2}><ProficienciesFieldset bind:values={proficiencies} {disabled} />
	<AttributeCheckboxFields label={m.savingThrows()} bind:values={savingThrows} {disabled} /></section>
	<section hidden={step !== 3}><SpecializationsFieldset bind:values={specializations} {disabled} />
	<TrainerPathsFieldset bind:value={trainerPath} {disabled} /></section>
	<section hidden={step !== 4}><FeatsFieldset feats={DndFeats} bind:values={feats} {disabled} /></section>
	<section hidden={step !== 5}><InventoryFieldset bind:money bind:inventory {disabled} />
	<Fieldset title="{m.general()}">
		<MarkdownField label="{m.description()}" bind:value={description} placeholder="{m["trainers.generalInfoAboutThisTrainer"]()}..." rows={12} {disabled} />
		<TagListField label="{m.tags()}" bind:value={tags} possibleTags={$allTags} />
	</Fieldset>
	<FormDetails title="{m.advanced()}">
		<Fieldset title="{m.basicInfo()}">
			<HitDiceField bind:value={hitDiceSize} {disabled} />
		</Fieldset>
	</FormDetails></section>
	<section hidden={step !== 6}>
		<h3>{name || "Unnamed trainer"} · Level {level}</h3>
		<p>AC {preview.ac} · HP {preview.hp.max} · Proficiency +{previewLevel.proficiencyBonus} · Initiative {initiative >= 0 ? "+" : ""}{initiative}</p>
		<label><input type="checkbox" bind:checked={applyBonuses} {disabled} /> Automatically apply new supported permanent bonuses</label>
		<p>Turn this off if you entered the bonuses manually. Existing saved bonuses are not reapplied.</p>
		<label><input type="checkbox" bind:checked={removeBakedFeats} disabled={disabled || !applyBonuses} /> Subtract removed supported feat bonuses (only if included in saved stats)</label>
		{#if acquired.hp}<p>Tough: {acquired.hp > 0 ? "+" : ""}{acquired.hp} maximum HP</p>{/if}
		{#each specialty.notes as note}<p>{note}</p>{/each}
		{#if reducedSpecialties}<p>Specialty rank reductions change matching Pokémon bonuses; old trainer score and skill gains must be adjusted manually because their original sources are not saved.</p>{/if}
		<AttributeBlock attributes={preview.attributes} />
		<SkillsInfo level={previewLevel} attributes={preview.attributes} {savingThrows} proficiencies={preview.proficiencies} featureTrainer={preview} />
		<p>Path: {trainerPath.name || "None"}</p>
		<p>Feats: {feats.map(feat => feat.name).join(", ") || "None"}</p>
		<p>Inventory entries: {inventory.length} · Money: {money}</p>
	</section>
	<ActionArea error={!isValid ? "One or more fields above have an issue." : !name.trim() && step === steps.length-1 ? "Enter a trainer name before saving." : undefined}>
		<Button on:click={cancel} variant="subtle" {disabled}>{m.cancel()}</Button>
		{#if step > 0}<Button on:click={() => goTo(step-1)} {disabled}>Back</Button>{/if}
		{#if step < steps.length-1}
			<Button on:click={() => goTo(step+1)} {disabled}>Next</Button>
		{:else}
			<Button type="submit" disabled={disabled || !isValid || !name.trim()}>Save trainer</Button>
		{/if}
	</ActionArea>
</Form>

<style>
	.steps { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-block: 0.75rem; }
	.steps button { min-height: 44px; padding: 0.4rem; }
	.steps button[aria-current="step"] { font-weight: bold; outline: 2px solid currentColor; }
	section[hidden] { display: none; }
</style>
