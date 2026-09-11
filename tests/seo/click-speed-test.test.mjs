import assert from "node:assert/strict";
import test from "node:test";

import {
  CLICK_SPEED_TEST_DURATION_SECONDS,
  buildClickSpeedTestResult,
  isClickSpeedTestFinished
} from "../../lib/click-speed-test/session.cjs";

test("uses a short fixed click-speed test duration", () => {
  assert.equal(CLICK_SPEED_TEST_DURATION_SECONDS, 5);
});

test("does not finish before the countdown reaches zero", () => {
  assert.equal(isClickSpeedTestFinished(1), false);
  assert.equal(isClickSpeedTestFinished(0), true);
});

test("builds a score summary from clicks and the fixed duration", () => {
  assert.deepEqual(buildClickSpeedTestResult(47), {
    clicks: 47,
    clicksPerSecond: 9.4,
    durationSeconds: 5
  });
});
