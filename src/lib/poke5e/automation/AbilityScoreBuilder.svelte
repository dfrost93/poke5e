<script lang="ts">
	import { Attributes } from "$lib/dnd/attributes/Attributes"
	import { standardArray, pointBuyCost, rollAbilityScores, scoresFromArray } from "./BuilderRules"
	export let attributes: Attributes
	export let disabled = false
	let method: "manual"|"array"|"point"|"roll" = "manual"
	$: scores = Attributes.list.map(({abbr})=>attributes.data[abbr])
	$: cost = pointBuyCost(scores)
	$: arrayValid = [...scores].sort((a,b)=>b-a).join(",") === standardArray.join(",")
	const start = (next: typeof method) => {
		method = next
		if (next === "array") attributes = scoresFromArray(standardArray)
		if (next === "point") attributes = scoresFromArray([8,8,8,8,8,8])
		if (next === "roll") attributes = scoresFromArray(rollAbilityScores())
	}
	const swap = (index: number, target: number) => {
		const values = [...scores]
		;[values[index],values[target]] = [values[target],values[index]]
		attributes = scoresFromArray(values)
	}
</script>
<div class="score-tools">
	<p>Choose a starting method only if you want to replace the currently entered scores. You can customize the result below for house rules.</p>
	<div class="buttons">
		<button type="button" {disabled} on:click={()=>start("array")}>Standard array</button>
		<button type="button" {disabled} on:click={()=>start("point")}>27-point buy</button>
		<button type="button" {disabled} on:click={()=>start("roll")}>Roll 4d6, drop lowest</button>
		<button type="button" {disabled} on:click={()=>start("manual")}>Manual</button>
	</div>
	{#if method === "point"}<p aria-live="polite">Point buy: {cost === null ? "Scores must be 8–15" : cost + " / 27 spent"}{cost != null && cost > 27 ? " (over budget)" : ""}. Homebrew overrides are allowed.</p>{/if}
	{#if method === "array"}<p>{arrayValid ? "Valid standard array." : "Customized array."} Swap values to assign your scores.</p>{/if}
	{#if method === "array" || method === "roll"}
		<div class="buttons">{#each Attributes.list as attr,i}{#if i>0}<button type="button" {disabled} on:click={()=>swap(i-1,i)}>Swap {Attributes.list[i-1].abbr.toUpperCase()} / {attr.abbr.toUpperCase()}</button>{/if}{/each}</div>
	{/if}
</div>
<style>
	.score-tools { margin-block: .75rem; }
	.buttons { display: flex; flex-wrap: wrap; gap: .4rem; }
	button { min-height: 44px; }
</style>