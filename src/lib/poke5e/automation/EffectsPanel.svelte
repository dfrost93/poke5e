<script lang="ts">
	import type { Attribute } from "$lib/dnd/attributes/Attributes"
	import type { Edition } from "$lib/srd/editions"
	import { addEffect, advanceEffects, applyPreset, applyFaintBoost, modifierKeys, selfMoves, receivedMoves, spendMirages, type Effect, type Modifier, type Preset } from "./ActiveEffects"

	export let effects: Effect[] = []
	export let edition: Edition
	export let level: number
	export let editable: boolean
	export let moves: readonly string[] = []
	export let abilities: readonly string[] = []
	export let saves: readonly Attribute[] = []

	let serial = 0
	let name = ""
	let modifier: Modifier = "attack"
	let amount: number | undefined = 1
	let duration: number | undefined = 1
	let encounter = false
	let concentration = false
	const nextId = () => "local-" + (++serial)
	const apply = (move: Preset) => { effects = applyPreset(effects, edition, move, level, nextId()) }
	const addCustom = () => {
		if (!name.trim() || amount == null || !Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 30) return
		if (!encounter && (duration == null || !Number.isInteger(duration) || duration < 1 || duration > 600)) return
		effects = addEffect(effects, { id: nextId(), name: name.trim(), modifiers: { [modifier]: amount }, turns: encounter ? null : duration!, concentration })
		name = ""
	}
	const signed = (n: number) => (n >= 0 ? "+" : "") + n
	const pretty = (id: string) => id.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")
</script>

{#if editable || effects.length}
	<section class="effects">
		<h2>Active combat effects</h2>
		<p class="hint">Temporary, on this open sheet only. These do not change saved base stats. Advance at the start of this creature's next turn; clear at the end of combat.</p>
		{#if effects.length === 0}<p>No active effects.</p>{/if}
		{#each effects as effect (effect.id)}
			<div class="effect">
				<div>
					<strong>{effect.name}</strong>
					<div>{Object.entries(effect.modifiers).map(([key, val]) => key.toUpperCase() + " " + signed(val ?? 0)).join(" · ")}
						{#if effect.mirages != null}{effect.mirages} sword mirages (+{effect.mirages} attack){/if}
					</div>
					<small>{effect.turns === null ? "Until cleared" : effect.turns + " turn(s) remaining"}{effect.concentration ? " · Concentration" : ""}</small>
				</div>
				{#if editable}
					<button type="button" on:click={() => effects = effects.filter(e => e.id !== effect.id)}>Remove</button>
				{/if}
			</div>
			{#if editable && effect.id === "swords-dance" && effect.mirages}
				<p class="hint">After a hit, choose how many mirages to spend. Add the move's MOVE modifier per mirage manually; no automatic damage or PP deduction.</p>
				<div class="controls">
					<button type="button" on:click={() => effects = spendMirages(effects, 1)}>Spend 1</button>
					<button type="button" disabled={effect.mirages < 2} on:click={() => effects = spendMirages(effects, 2)}>Spend 2</button>
				</div>
			{/if}
		{/each}
		{#if editable}
			<div class="controls">
				<button type="button" disabled={!effects.some(e => e.turns !== null)} on:click={() => effects = advanceEffects(effects)}>Next turn</button>
				<button type="button" disabled={!effects.some(e => e.concentration)} on:click={() => effects = effects.filter(e => !e.concentration)}>End concentration</button>
				<button type="button" disabled={!effects.length} on:click={() => effects = []}>End combat / clear</button>
			</div>
			{#if edition === "2024"}
				{#if selfMoves.some(move => moves.includes(move))}
					<h3>Apply after using a move</h3>
					<div class="controls">
						{#each selfMoves.filter(move => moves.includes(move)) as move}
							<button type="button" on:click={() => apply(move)}>{pretty(move)}</button>
						{/each}
					</div>
				{/if}
				<h3>Apply after failing an enemy save</h3>
				<div class="controls">
					{#each receivedMoves as move}
						<button type="button" disabled={effects.filter(e => e.group === move).length >= 5} on:click={() => apply(move)}>{pretty(move)}</button>
					{/each}
				</div>
				{#if abilities.some(id => ["beast-boost", "soul-heart", "eelevate"].includes(id))}
					<h3>Confirm ability trigger</h3>
					<div class="controls">
						{#each (["beast-boost", "soul-heart", "eelevate"] as const).filter(id => abilities.includes(id)) as ability}
							<button type="button" disabled={!saves.length} on:click={() => effects = applyFaintBoost(effects, edition, ability, saves)}>{pretty(ability)}: {ability === "soul-heart" ? "ally fainted" : "opponent fainted"}</button>
						{/each}
					</div>
				{/if}
				<p class="hint">Confirm PP, action availability, saves and targets manually before applying presets.</p>
			{/if}
			<details>
				<summary>Add custom buff or debuff</summary>
				<div class="custom">
					<label>Effect name <input bind:value={name} maxlength="100" placeholder="e.g. Cheerleader" /></label>
					<label>Statistic <select bind:value={modifier}>{#each modifierKeys as key}<option value={key}>{key.toUpperCase()}</option>{/each}</select></label>
					<label>Bonus or penalty <input type="number" bind:value={amount} min="-30" max="30" step="1" /></label>
					<label>Turns remaining <input type="number" bind:value={duration} min="1" max="600" step="1" disabled={encounter} /></label>
					<label><input type="checkbox" bind:checked={encounter} /> Until end of combat / removed</label>
					<label><input type="checkbox" bind:checked={concentration} /> Requires concentration</label>
					<button type="button" disabled={!name.trim() || !amount} on:click={addCustom}>Apply modifier</button>
				</div>
			</details>
		{/if}
	</section>
{/if}

<style>
	.effects { border: 1px solid currentColor; border-radius: 0.5rem; padding: 0.75rem; margin-block: 1rem; }
	.effect { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding-block: 0.5rem; border-bottom: 1px solid currentColor; }
	.controls { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-block: 0.5rem; }
	button { min-height: 44px; padding-inline: 0.6rem; }
	.hint { font-size: 0.875em; }
	.custom { display: grid; gap: 0.5rem; margin-block: 0.5rem; }
	.custom label { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.25rem; }
	summary { cursor: pointer; font-weight: bold; }
</style>
