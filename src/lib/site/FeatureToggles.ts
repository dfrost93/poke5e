import { browser } from "$app/environment"

type Status = "Hidden" | "Early" | "In Development" | "Ready"

export type FeatureToggle = {
	id: string,
	name: string,
	isActive: () => boolean,
	status: Status,
	description: string,
}

function toggle(name: string, status: Status, description: string) {
	return {
		id: name,
		name: name.replace(/([A-Z])/g, " $1").trim(),
		isActive: () => isFeatureActive(name),
		status,
		description,
	}
}

// function active() {
// 	return () => true
// }

export function isFeatureActive(feature: string): boolean {
	return browser ? localStorage.getItem(`feature-toggle::${feature}`) != null : false
}

export function setFeatureActive(feature: string, isActive: boolean) {
	if (!browser) return
	if (isActive) {
		localStorage.setItem(`feature-toggle::${feature}`, "true")
	} else {
		localStorage.removeItem(`feature-toggle::${feature}`)
	}
}

// example: FakemonEvolutions: toggle("FakemonEvolutions"),
export const FeatureToggles = {
	OverrideMaintenance: toggle("OverrideMaintenance", "Hidden", ""),
	PreviewUpdatedMoves: toggle("PreviewUpdatedMoves", "In Development", "Some moves, abilities, and pokemon movesets are being modernized. Updated moves can be previewed on the Moves Page, clicking on the Filters button, and setting \"Updated Recently\" to \"On\"."),
	CustomMoves: toggle("CustomMoves", "Early", "Will allow the creation and sharing of custom moves. There is nothing to test yet, as pages for this are still being built."),
	MoveCustomization: { ...toggle("MoveCustomization", "Ready", "Expanded move library and move customization are enabled in Poké5e Advanced."), isActive: () => true },
	Accounts: toggle("Accounts", "Hidden", ""),
}
