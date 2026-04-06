# App Development Team Playbook

## Recommended Sequence

1. Product architecture
2. Data model and contracts
3. Backend implementation
4. Frontend integration
5. QA and release checks

## Handoff Rules

- Product architecture defines flows, states, and feature edges.
- Data model defines entities and persistence invariants.
- Backend exposes stable contracts and error semantics.
- Frontend consumes stable contracts and handles loading, empty, and error states.
- QA validates happy path, boundaries, and regression risk before release.

## Escalation Rules

- Re-plan when the API contract changes after UI work starts.
- Re-plan when the data model cannot support the intended user flow cleanly.
- Re-plan when release risk exceeds the feature value for the current phase.

