import assert from "node:assert/strict";
import test from "node:test";

import {getClassicRemainingTime} from "../../lib/game/classicTimer.ts";

test("resets the remaining time when a Classic rematch begins its countdown", () => {
  assert.equal(
    getClassicRemainingTime({
      previousRemainingTime: 0,
      status: "countdown",
      timerSeconds: 10
    }),
    10
  );
});

test("keeps the running remaining time while Classic is playing", () => {
  assert.equal(
    getClassicRemainingTime({
      previousRemainingTime: 4,
      status: "playing",
      timerSeconds: 10
    }),
    4
  );
});
