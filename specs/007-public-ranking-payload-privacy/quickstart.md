# Quickstart: Public Ranking Payload Privacy

## Safe focused validation

From the repository root, run the synthetic pure regression:

```sh
node --test tests/lib/publicRanking.test.ts
```

Run the repository TypeScript check:

```sh
npm run check:tsc
```

Run lint on changed application and test files:

```sh
node_modules/.bin/eslint app/ranking/page.tsx components-new/Ranking/types.d.ts components-new/Ranking/components/RankingList/index.tsx lib/ranking/publicRanking.ts tests/lib/publicRanking.test.ts
```

Check whitespace and inspect the patch:

```sh
git diff --check
git diff -- app/ranking/page.tsx components-new/Ranking/types.d.ts components-new/Ranking/components/RankingList/index.tsx lib/ranking/publicRanking.ts tests/lib/publicRanking.test.ts
```

## Safety boundaries

- Unit fixtures are synthetic and use `.invalid` email domains.
- No Firestore reads/writes are performed by tests.
- Do not run authenticated-player E2E, preview/deployment, or Firebase-backed tests for this change.
- Preview and dev domain validation remain outside this implementation authorization.
