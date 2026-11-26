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
	const steps = ["Identity", "Ability scores", "Skills & saves", "Path & specialties", "Feats", "Equipment & notes", "Review"]
	const hints = ["Choose your trainer’s name, level, health and background.", "Set the six base ability scores using your campaign’s chosen method.", "Choose proficiencies, expertise and saving throw proficiencies.", "Review paths and type specializations. Use the level-up wizard for acquisition effects, or set their permanent bonuses manually here.", "Read feat rules before selecting. Existing permanent bonuses are preserved; acquisition effects not handled here remain manual.", "Choose items, money, biography notes and optional settings. Inventory is not automatically equipped.", "Review derived stats and your selections before saving."]
	$: previewLevel = new Level(level)
	$: preview = { ...trainer, name, level: previewLevel, attributes, proficiencies, savingThrows, feats, path: trainerPath, specializations, ac }
	$: initiative = characterInitiative($currentEdition, preview)
	const goTo = (index: number) => { if (!disabled) step = Math.max(0, Math.min(steps.length-1,index)) }

	const cancel = () => {
		dispatch("cancel")
	}
	const endEdit = () => {
		if (step !== steps.length-1 || disabled || !isValid || !name.trim()) return
		const selectedPath = TrainerPaths.find(path => path.name === trainerPath.name)
		const pathToSave = trainerPath.name !== trainer.path.name && selectedPath ? { ...trainerPath, resource: selectedPath.resource && level >= selectedPath.resource.acquiredAtLevel ? selectedPath.resource.max(preview) : 0 } : trainerPath
		dispatch("update", {
			trainer: {
				name,
				description,
				level: new Level(level),
				ac,
				hp: Resource.adjustMax(trainer.hp, maxHp),
				hitDice: Resource.adjustMax(trainer.hitDice, maxHitDice),
				attributes,
				proficiencies,
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
	<section hidden={step !== 1}><AttributesFieldset bind:values={attributes} {disabled} /></section>
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
		<p>AC {ac} · HP {maxHp} · Proficiency +{previewLevel.proficiencyBonus} · Initiative {initiative >= 0 ? "+" : ""}{initiative}</p>
		<AttributeBlock {attributes} />
		<SkillsInfo level={previewLevel} {attributes} {savingThrows} {proficiencies} featureTrainer={preview} />
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
