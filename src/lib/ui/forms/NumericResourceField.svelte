<script lang="ts" context="module">
	export type ChangeDetail = {
		value: number
	}

	const DEBOUNCE_PERIOD_MS = 500
</script>

<script lang="ts">
	import { createEventDispatcher } from "svelte"
	

	const dispatch = createEventDispatcher()

	export let id: string
	export let value: number
	export let disabled: boolean = false

	const debounceTimerId = { current: -1 }

	$: width = value?.toString()?.length ?? 0

	const onChange = (e: Event) => {
		clearTimeout(debounceTimerId.current)
		const target = e.target as HTMLInputElement
		const addOrSubtractPattern = /(\d+)\s*(\+|-)\s*(\d+)/
		const expression = target.value.match(addOrSubtractPattern)
		if (expression != null) {
			value = parseFloat(expression[1]) + parseFloat(expression[2] + expression[3])
		} else {
			const numericValue = parseFloat(target.value)
			value = isNaN(numericValue) ? 0 : numericValue
		}

		dispatch("change", { value } as ChangeDetail)
	}

	const onInput = (e: Event) => {
		const target = e.target as HTMLInputElement
		width = target.value.length
	}

	const updateValueBy = (amount: number) => {
		if (disabled) return
		value += amount

		clearTimeout(debounceTimerId.current)
		debounceTimerId.current = window.setTimeout(() => {
			dispatch("change", { value } as ChangeDetail)
		}, DEBOUNCE_PERIOD_MS)
	}

	const decrement = () => updateValueBy(-1)
	const increment = () => updateValueBy(1)

	const onKeyDown = (e: KeyboardEvent) => {
		const target = e.target as HTMLInputElement
		const currentValue = parseInt(target.value)
		if (isNaN(currentValue)) return

		if (e.key === "ArrowDown") {
			e.preventDefault()
			decrement()
		} else if (e.key === "ArrowUp") {
			e.preventDefault()
			increment()
		}
	}
</script>

<span class="numeric-resource-field">
	<button type="button" aria-label="Decrease value" on:click={decrement} {disabled}>−</button>
	<input {id} type="text" {value} on:change={onChange} on:input={onInput} on:keydown={onKeyDown} {disabled} autocomplete="off" inputmode="text" style:width="{Math.max(3, width + 1)}ch" />
	<button type="button" aria-label="Increase value" on:click={increment} {disabled}>+</button>
</span>

<style>
	.numeric-resource-field {
		min-width: var(--input-min-width, 100%);
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
	}
	input {
		min-inline-size: 3ch;
		max-inline-size: 100%;
		flex: 1;
		text-align: center;
		padding: 0.25rem;
	}
	button {
		box-sizing: border-box;
		min-inline-size: 44px;
		min-block-size: 44px;
		flex: none;
		font: inherit;
		font-weight: bold;
		cursor: pointer;
	}
	button:disabled { cursor: default; opacity: 0.5; }
	button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
</style>
