<script lang="ts">
	import { Attributes } from "./Attributes"
	import { PlusMinus } from "$lib/ui/elements"
	export let attributes: Attributes
</script>
<dl class="ability-grid">
	{#each Attributes.list as attribute}
		<div class="ability">
			<dt><abbr title={attribute.name}>{attribute.abbr}</abbr></dt>
			<dd class="modifier"><PlusMinus value={attributes[attribute.abbr].modifier} /></dd>
			<dd class="score" title="Ability score">{attributes[attribute.abbr].score}</dd>
		</div>
	{/each}
</dl>
<style>
	.ability-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .5rem; text-align: center; }
	.ability { border: 1px solid var(--skin-bg-dark); border-radius: .6rem; padding: .4rem; background: var(--skin-bg); color: var(--skin-bg-text); }
	dt { font-weight: 700; text-transform: uppercase; font-size: .8em; }
	dd { margin: 0; }
	.modifier { font-size: 1.6em; font-weight: 700; }
	.score { border: 1px solid currentColor; border-radius: 1rem; width: fit-content; padding: .05rem .5rem; margin: 0 auto; font-size: .85em; }
	@media (min-width: 50rem) { .ability-grid { grid-template-columns: repeat(6,minmax(0,1fr)); } }
</style>