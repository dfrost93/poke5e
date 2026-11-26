# Advanced rules automation: milestone 1 (draft)

This branch introduces derived sheet calculations, not a combat simulator. The 2024 source data is the reference; do not import video-game effects. The 2018 rules retain their original calculations except the initiative display and shared UI fixes.

| Rule | Status |
| --- | --- |
| Blaze, Overgrow, Torrent, Swarm | Derived STAB multiplier at 25% HP or less; requires conscious Pokémon |
| Serene Grace | Derived save DC +2 |
| Fire Mane, Steelworker, Competitive | Derived conditional damage |
| Ace Trainer level 2 | Derived attack and damage |
| Hobbyist level 9 Generalist | Derived untrained skill bonus |
| Muscle Band, Wise Glasses, Charcoal, Black Belt | Derived damage, once-per-move reminder; hit resolution pending |
| Assault Vest | Derived AC and move restriction reminder; enforcement pending |
| Quick Claw, Alert | Derived initiative |
| AC Up and other acquisition-time features | Existing stored values preserved; migration and full coverage pending |
| Other abilities, feats, equipment, paths | Pending individual rule encoding and tests |
| All moves | Existing formula calculation plus supported modifiers; execution, conditions, durations, target effects, dice rolls, PP consumption pending |
| Delta species | Pending |
| Trainer equipment | Pending explicit equip state; never treat all inventory as equipped |
| Mobile number controls | Larger, labeled, keyboard-accessible +/-; visual testing pending |
| Inventory | Negative quantity prevented on edit; consumption and undo pending |

Important: existing manual move bonuses are preserved. Remove any manual duplicate bonuses (e.g. an Ace Trainer +1 manually entered) when adopting automation. A future migration/override interface must prevent double-counting. No saved character data or schema changes in this milestone. Unsupported effects remain manual; no claim of full coverage. Verify with pnpm test:unit, pnpm check and browser tests before merging.
