# Quickstart: Reaction Battle Security and Reliability

## Local preparation

1. Use the feature branch `004-reaction-battle-security`.
2. Configure the Firebase Emulator Suite with isolated project/test identities; do not point automated writes at production Firebase.
3. Ensure `firebase.json` explicitly wires `database.rules.json` and `firestore.rules` so emulator and deploy targets use repository rules.
4. Seed rooms only through a privileged test fixture; use separately authenticated emulator clients for rule assertions.

## Required verification

1. Run the focused RTDB/Firestore emulator rule suite.
2. Run focused unit tests for result eligibility, false-start terminality, tie ordering, server-time readiness, and transition retry/idempotency.
3. Run the targeted Reaction Battle Playwright suite after the project's logged-in-player auth setup.
4. Run `npm run check:tsc`, `npm run lint`, and `npm run check:i18n` for changed code and copy.

## Essential emulator scenarios

- Own first result allowed; another user's result, overwrite, delete, malformed payload, invalid reaction, and unauthorized transition rejected.
- Host legal lifecycle transitions allowed; distinct concurrent valid participant writes preserved.
- Unauthorized statistics writes rejected; trusted derived persistence accepts only an eligible completed round.
- Join, leave, kick, host lease/presence, disconnect signal, and ghost cleanup retain their intended ownership.

## Essential browser scenarios

- Start stays disabled with clear feedback until time readiness, then a normal two-player round works.
- False start remains terminal; simultaneous valid results are preserved; timeout and next round have no stale results.
- Simulated failed start, promote, finalize, reset, and lobby transitions expose retry and recover without reload; rapid repeated activation creates one state change.
- Classic-speed and rooms with no `gameMode` still run classic behavior.
- Ranking excludes invalid/suspicious values and labels any client-measured trust limitation accurately.

## Delivery verification

1. Validate the branch on its Vercel preview, treating it as potentially connected to production Firebase unless environment configuration proves otherwise.
2. Merge only reviewed, validated work into `develop`.
3. Validate integrated flows at `https://dev.click-battle.com.ar/` before opening the production promotion PR.
