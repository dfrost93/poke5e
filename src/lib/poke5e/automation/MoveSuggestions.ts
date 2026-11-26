/** Rankings are suggestions, never a grant of species learnability. */
export type MoveCandidate = { id: string, name: string, type: string }
export type Suggestion<T extends MoveCandidate> = { move: T, reason: string, rank: number }

export function recommendMoves<T extends MoveCandidate>(moves: readonly T[], currentLevelMoves: readonly string[], laterLevelMoves: readonly string[], chosenTypes: readonly string[], known: readonly string[]): Suggestion<T>[] {
	const current = new Set(currentLevelMoves)
	const later = new Set(laterLevelMoves)
	const types = new Set(chosenTypes)
	const existing = new Set(known)
	return moves.filter(move => !existing.has(move.id)).flatMap(move => {
		const match = types.has(move.type)
		if (current.has(move.id)) return [{ move, reason: match ? "Species and level eligible · matching type" : "Species and level eligible", rank: match ? 0 : 1 }]
		if (match && !later.has(move.id)) return [{ move, reason: "Matching type · homebrew suggestion, DM approval", rank: 2 }]
		return []
	}).sort((a,b) => a.rank-b.rank || a.move.name.localeCompare(b.move.name))
}
