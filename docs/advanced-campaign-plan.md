# Poké5e Advanced: campaign and battle architecture

Accepted feature requirements. This document is a plan, not a claim that the multiplayer service exists.

## Milestone sequence
1. Finish independent backend compatibility and audit existing capability-key RPCs. Keep legacy endpoints closed until verified. Validate assets, database permissions, Android APK, and basic save/reload.
2. Complete edition-aware transformations and battle conditions in the shared rules engine. Persist state without overwriting base sheets.
3. Add authenticated accounts, campaign ownership/membership and explicit trainer linking consent. DM can edit linked sheets while membership is active; players retain control of their own sheets outside the campaign. No trainer write keys sent to other clients.
4. Add encounter templates, DM-only statblocks and player-safe projections; server validates edits and role permissions. Use private real-time subscriptions to notify clients of authorized updates; refetch canonical state on reconnect. Never broadcast raw enemy records or hidden identifiers to players.
5. Add initiative, shared weather/terrain, roll requests and DM confirmation, change history, undo, rewards and campaign rules. Expand to maps, tokens and fog of war later. Internet-backed Wi-Fi/mobile data first; offline LAN play separate.

## Transformations
Store persistent base stats and active form separately. Each definition can override or adjust STR/DEX/CON/INT/WIS/CHA, abilities, types, AC, max HP, temporary HP, size, movement, artwork and moves; recompute derived skills, saves, STAB, damage, DC and immunities. Retain earned XP, items, PP use and damage through reversion; define HP mapping and temporary resource policy explicitly per form. Disable replaced ability effects. Support manual triggers, HP thresholds, combat events and weather, with turn/round expiry and DM override. Edition rules are distinct: 2024 Mega level 10, final stage, Megalite and trainer Key Stone, +2 AC, doubled applicable modifiers; 2018 level 13, final stage, Megalite, +3 AC, twice-level temporary HP, five rounds, once per trainer long rest. Other form stat changes are optional homebrew where not specified by rules. Never double-count stat deltas and modifier rules.

## Battle conditions
Track weather, terrain, lighting, statuses and temporary effects as separate sources. Roll mode is normal, advantage or disadvantage by roll category; opposing sources cancel and identical sources do not stack. Damage advantage rolls whole damage expressions twice, not d20s. 2024 harsh sun/rain apply typed damage advantage/disadvantage; sand/snow modify eligible AC. Use edition-specific ability descriptions for Forecast, Swift Swim, Chlorophyll, Drought, Drizzle, Sand Rush, Sand Veil, Snow Cloak, Solar Power, Air Lock and Cloud Nine. Show provenance in calculated stats. Global weather is DM controlled in linked encounters. Track expiry and damage origin; don't assume automatic immunity or weather triggers not specified by edition.

## Security and synchronization
Use Supabase Auth user IDs and server-verified campaign membership, not client role claims. Separate DM records, owner sheets and player-safe encounter payloads. Default-deny RLS, scoped grants, role checks on every mutation, tests for outsider and cross-campaign access, and revocation on membership removal. A player-safe projection must be generated server-side, never merely hidden in UI. The pure CampaignVisibility helper is a contract and testable example, not a security boundary by itself. Allow field-specific reveals, descriptive HP, revealed moves only, hide enemy identities and unrevealed combatants. Version writes and use idempotent operations to prevent duplicate actions; record actor, timestamp and reversible deltas. DM private notes, unrevealed stats and secret dice must not enter player feeds. Never embed service-role credentials in APK.

## Acceptance tests before multiplayer release
Two separate authenticated accounts on distinct devices; join and leave campaign; explicit trainer linking; DM edits HP/items/status; player sees authorized change; player cannot edit other trainers or read hidden enemies even via direct API; weather updates both sheets; transformation changes stats and ability, reversion preserves resources; reconnect and conflict handling; DM undo and revocation. Test across different networks.
