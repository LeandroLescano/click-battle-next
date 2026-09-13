import assert from "node:assert/strict";
import test from "node:test";

import {getRoomStatsDateRange} from "../../lib/game/adminDateRange.ts";

test("keeps the selected local calendar days", () => {
  const range = getRoomStatsDateRange("2026-08-15", "2026-09-13");

  assert.deepEqual(
    [
      range.start?.getFullYear(),
      range.start?.getMonth(),
      range.start?.getDate(),
      range.start?.getHours(),
      range.start?.getMinutes()
    ],
    [2026, 7, 15, 0, 0]
  );
  assert.deepEqual(
    [
      range.end?.getFullYear(),
      range.end?.getMonth(),
      range.end?.getDate(),
      range.end?.getHours(),
      range.end?.getMinutes(),
      range.end?.getSeconds(),
      range.end?.getMilliseconds()
    ],
    [2026, 8, 13, 23, 59, 59, 999]
  );
});
