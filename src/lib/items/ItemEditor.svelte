<script lang="ts" context="module">
	export const getItemFieldName = (id: string) => `item-id-${id}`
</script>

<script lang="ts">
	import { MarkdownField, SelectField, TextField, Removable, Divider } from "$lib/ui/forms"
	import type { HeldItem } from "$lib/trainers/types"
	import { ItemStore } from "./store"
	import { Item, type ItemType } from "./Item"
	import { m } from "$lib/site/i18n"
	import { Markdown } from "$lib/ui/rendering"

	export let value: HeldItem
	export let groupOrder: ItemType[] = []
	export let disabled: boolean = false

	$: itemGroups = Item.groupByType($ItemStore ?? [], groupOrder)
	$: itemOptions = itemGroups.map((group => ({
		name: group.name,
		values: group.items.map((item) => ({
			name: item.name,
			value: item.id,
		})),
	})))

	$: itemFieldName = getItemFieldName(value.id)
	$: selected = value.type === "standard" ? ($ItemStore ?? []).find(item => item.id === value.itemId) : undefined
</script>

{#if value.type === "standard"}
	<Removable on:remove>
		<SelectField label="Item" name="{itemFieldName}" bind:value={value.itemId} options={itemOptions} {disabled} />
	</Removable>
	{#if selected}<details open><summary>{selected.name} · {selected.type}</summary><Markdown value={selected.description} />{#if selected.cost != null}<p>Cost: ₽{selected.cost}</p>{/if}</details>{/if}
{:else}
	<Removable on:remove>
		<TextField label={m.name()} name="{itemFieldName}" bind:value={value.name} {disabled} />
	</Removable>
	<MarkdownField label="Item Description" name="item-description-{value.id}" bind:value={value.description} {disabled} />
{/if}
<Divider />