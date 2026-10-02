# IAYO PRIVATE 0.1

Private personal portal. Architectural boundary: FERVAL corporate data is not imported by default.

## Identity
- Single owner account.
- No N2/N3 roles.
- Private memory namespace only.
- Server verifies owner identity; client never grants ownership.

## Layers
1. Gateway: authentication + owner check.
2. Conversation: private sessions/messages.
3. Memory: candidate -> validated -> active; source and timestamps required.
4. State: current goals, open loops, preferences and capabilities.
5. Reflection: observations separated from facts.
6. Outcomes: result tracking for decisions/initiatives.
7. Initiative: proposals to owner; no silent irreversible actions.
8. PUSH: owner opt-in, sound/notification/badge when platform permits.
9. Voice: transcription/input; later real-time voice can be added independently.
10. I9A: scenario analysis; kept separate from authoritative memory until validated.

## Safety boundary
- FERVAL employee chats, N2/N3 data and corporate secrets are not copied into PRIVATE.
- Any future bridge is explicit, scoped and auditable.
- PUSH failure must never break chat/login/memory.
- External actions require explicit permissions and are logged.

## Data contract (future dedicated Supabase)
private_profiles
private_sessions
private_messages
private_memory
private_memory_candidates
private_state
private_reflections
private_outcomes
private_initiatives
private_push_subscriptions
private_audit_log
