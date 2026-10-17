import assert from "node:assert/strict";
import test from "node:test";

import {getRoomGameModeBreakdown} from "../../lib/game/roomGameModes.ts";

test("keeps each played mode when a room switches modes", () => {
  const modes = getRoomGameModeBreakdown({
    gameMode: "classic-speed",
    gamesPlayed: [
      ...Array.from({length: 20}, () => ({gameMode: "classic-speed" as const})),
      {gameMode: "reaction" as const}
    ]
  });

  assert.deepEqual(modes, [
    {gameMode: "classic-speed", gamesPlayed: 20},
    {gameMode: "reaction", gamesPlayed: 1}
  ]);
});

test("uses the room mode for legacy rounds without a mode", () => {
  const modes = getRoomGameModeBreakdown({
    gameMode: "reaction",
    gamesPlayed: [{}, {}]
  });

  assert.deepEqual(modes, [{gameMode: "reaction", gamesPlayed: 2}]);
});

test("shows the configured mode for a room with no played rounds", () => {
  const modes = getRoomGameModeBreakdown({
    gameMode: "reaction",
    gamesPlayed: []
  });

  assert.deepEqual(modes, [{gameMode: "reaction", gamesPlayed: 0}]);
});
