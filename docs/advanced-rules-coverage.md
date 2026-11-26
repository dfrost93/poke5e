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

## Milestone 2: active effects (draft)

- Local, editable active effects panel on trainer and Pokémon sheets; state is not saved and is cleared on character/edition change or page unload. No shared combat state or PP/action consumption yet.
- Custom numeric modifiers to attributes, AC, attack, damage, DC, saves, skills, initiative, speed. Attack/damage/DC and movement apply on Pokémon sheets; trainer attack/movement systems are not present. Attribute changes are bounded to 1–30 and recalculate derived values; HP maximum adjustments from CON are not implemented.
- 2024 move presets: Agility, Barrier (self only), Bulk Up, Defense Curl (AC only), Swords Dance (mirages, manual bonus damage), Growl and Sand Attack (confirmed failed saves). Ten-turn duration uses manual start-of-turn ticks. Concentration replacement/removal and stack limits included; no target automation.
- Beast Boost, Soul-Heart, Eelevate: confirm trigger, +2 to save-proficient attributes up to +10 per ability, until end of combat. The combined interaction of multiple such abilities needs review.
- 17 verified type-boosting held items now included, with once-per-move reminders. No enforcement of hit counts yet.
- Initiative d20 button stores the roll and modifier used, not a shared initiative order.
- Previous manual modifiers remain in place; remove any duplicates before play. Do not merge until unit tests, type-check and browser checks pass.
