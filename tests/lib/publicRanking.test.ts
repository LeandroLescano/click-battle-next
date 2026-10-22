import type {CrossTimestamp, MaxScore} from "@leandrolescano/click-battle-core";
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicReactionRanking,
  toPublicClassicRankingEntry
} from "../../lib/ranking/publicRanking.ts";

const timestamp: CrossTimestamp = {
  seconds: 1_797_000_000,
  nanoseconds: 0,
  toDate: () => new Date(1_797_000_000_000),
  toMillis: () => 1_797_000_000_000
};

const score = (clicks: number, time: number): MaxScore => ({
  clicks,
  time,
  date: timestamp
});

const publicClassicKeys = ["cps", "key", "mode", "time", "username"];
const publicReactionKeys = [
  "key",
  "mode",
  "reactionMs",
  "roundsWon",
  "username"
];

test("Classic public ranking serializes only allowlisted fields and preserves scores and order", () => {
  const calculatedRows = [
    Object.assign(
      {
        key: "uid-alice",
        username: "Alice",
        cps: 16.67,
        time: 3,
        email: "alice@example.invalid",
        maxScores: [score(50, 3), score(100, 10)],
        providers: ["password"],
        lastLogin: timestamp,
        userPreferences: {
          allowEmailContact: true,
          lastFeedbackRequest: timestamp
        }
      },
      {privateInternalNote: "synthetic-only"}
    ),
    Object.assign(
      {
        key: "uid-bob",
        username: "Bob",
        cps: 12.5,
        time: 2,
        email: "bob@example.invalid",
        maxScores: [score(25, 2)],
        providers: ["google.com"]
      },
      {accountMetadata: {billingReference: "fixture-only"}}
    ),
    {
      key: "uid-carol",
      username: "Carol",
      cps: 8.4,
      time: 5,
      email: "carol@example.invalid",
      maxScores: [score(42, 5)]
    }
  ];

  const publicRows = calculatedRows.flatMap((entry) => {
    if (typeof entry.key !== "string") return [];

    return [
      toPublicClassicRankingEntry({
        key: entry.key,
        username: entry.username,
        cps: entry.cps,
        time: entry.time
      })
    ];
  });
  const serialized = JSON.parse(JSON.stringify(publicRows)) as Array<
    Record<string, unknown>
  >;

  assert.deepEqual(
    serialized.map((entry) => Object.keys(entry).sort()),
    calculatedRows.map(() => publicClassicKeys)
  );
  assert.deepEqual(serialized, [
    {
      key: "uid-alice",
      username: "Alice",
      cps: 16.67,
      time: 3,
      mode: "classic-speed"
    },
    {
      key: "uid-bob",
      username: "Bob",
      cps: 12.5,
      time: 2,
      mode: "classic-speed"
    },
    {
      key: "uid-carol",
      username: "Carol",
      cps: 8.4,
      time: 5,
      mode: "classic-speed"
    }
  ]);
});

test("local Classic entry projection excludes private profile and score-history fields", () => {
  const localProfile = Object.assign(
    {
      key: "auth-local-user",
      username: "Local player",
      cps: 9.25,
      time: 4,
      email: "local@example.invalid",
      maxScores: [score(37, 4)],
      lastLogin: timestamp
    },
    {sessionSecret: "synthetic-only"}
  );

  const serialized = JSON.parse(
    JSON.stringify(toPublicClassicRankingEntry(localProfile))
  ) as Record<string, unknown>;

  assert.deepEqual(Object.keys(serialized).sort(), publicClassicKeys);
  assert.deepEqual(serialized, {
    key: "auth-local-user",
    username: "Local player",
    cps: 9.25,
    time: 4,
    mode: "classic-speed"
  });
});

test("Reaction producer filters, aggregates, sorts, and excludes private source fields", () => {
  const sourceRooms = [
    Object.assign(
      {
        gamesPlayed: [
          Object.assign(
            {
              gameMode: "reaction" as const,
              eligible: true,
              reactionWindowMs: 1_000,
              winnerMetric: "reactionMs" as const,
              winnerScore: 185.4,
              winnerUsername: "Alice"
            },
            {
              winnerEmail: "alice@example.invalid",
              internalResultId: "synthetic-alice-1"
            }
          ),
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 190.5,
            winnerUsername: "Alice",
            privateNote: "synthetic-alice-2"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 205.2,
            winnerUsername: "Bob",
            winnerEmail: "bob@example.invalid"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 199.6,
            winnerUsername: "Bob"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 199.5,
            winnerUsername: "Amy"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 200.2,
            winnerUsername: "Zara"
          },
          {
            gameMode: "classic-speed" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 150,
            winnerUsername: "Wrong mode"
          },
          {
            gameMode: "reaction" as const,
            eligible: false,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 150,
            winnerUsername: "Ineligible"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "clicks" as const,
            winnerScore: 150,
            winnerUsername: "Wrong metric"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 99.4,
            winnerUsername: "Too fast"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 500,
            winnerMetric: "reactionMs" as const,
            winnerScore: 501,
            winnerUsername: "Outside window"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: null,
            winnerUsername: "Missing score"
          },
          {
            gameMode: "reaction" as const,
            eligible: true,
            reactionWindowMs: 1_000,
            winnerMetric: "reactionMs" as const,
            winnerScore: 150
          }
        ]
      },
      {
        ownerProfile: {
          email: "room-owner@example.invalid",
          billingReference: "synthetic-only"
        }
      }
    )
  ];

  const reactionRows = buildPublicReactionRanking(sourceRooms);
  const serialized = JSON.parse(JSON.stringify(reactionRows)) as Array<
    Record<string, unknown>
  >;

  assert.deepEqual(
    serialized.map((entry) => Object.keys(entry).sort()),
    [
      publicReactionKeys,
      publicReactionKeys,
      publicReactionKeys,
      publicReactionKeys
    ]
  );
  assert.deepEqual(serialized, [
    {
      key: "Alice-reaction",
      mode: "reaction",
      reactionMs: 185,
      roundsWon: 2,
      username: "Alice"
    },
    {
      key: "Bob-reaction",
      mode: "reaction",
      reactionMs: 200,
      roundsWon: 2,
      username: "Bob"
    },
    {
      key: "Amy-reaction",
      mode: "reaction",
      reactionMs: 200,
      roundsWon: 1,
      username: "Amy"
    },
    {
      key: "Zara-reaction",
      mode: "reaction",
      reactionMs: 200,
      roundsWon: 1,
      username: "Zara"
    }
  ]);
});
