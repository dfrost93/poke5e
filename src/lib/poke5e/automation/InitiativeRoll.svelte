<script lang="ts">
	export let bonus: number
	let result: { die: number, bonus: number } | null = null
	const roll = () => { result = { die: Math.floor(Math.random() * 20) + 1, bonus } }
	const signed = (n: number) => n >= 0 ? "+" + n : String(n)
</script>
<div class="initiative">
	<span>Initiative: <strong>{signed(bonus)}</strong></span>
	<button type="button" on:click={roll}>Roll d20</button>
	{#if result}<span aria-live="polite"><strong>{result.die + result.bonus}</strong> (d20 {result.die}, modifier {signed(result.bonus)})</span>{/if}
</div>
<style>
	.initiative { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-block: 0.5rem; }
	button { min-height: 44px; }
</style>
