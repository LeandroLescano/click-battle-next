import test from "node:test";
import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, falseStartResult, rtdb, ref, room, seedRoom, set, validResult} from "./fixtures.mjs";

const resultPath = (uid) => `games/room-1/reactionRounds/round-1/results/${uid}`;
test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());
test.beforeEach(async () => seedRoom(room()));

test("a participant creates exactly one valid personal result", async () => {
  await assertSucceeds(set(ref(rtdb("guest"), resultPath("guest")), validResult()));
  await assertFails(set(ref(rtdb("guest"), resultPath("guest")), validResult()));
  await assertFails(set(ref(rtdb("guest"), resultPath("host")), validResult("host", "Host")));
});

test("invalid identities and implausible reaction values are denied", async () => {
  await assertFails(set(ref(rtdb("guest"), resultPath("guest")), {...validResult("host", "Guest"), reactionMs: 99}));
  await assertFails(set(ref(rtdb("guest"), resultPath("guest")), {...validResult(), reactionMs: 5001}));
});

test("two authenticated participants preserve concurrent result paths", async () => {
  const hostResult = validResult("host", "Host");
  await Promise.all([
    assertSucceeds(set(ref(rtdb("guest"), resultPath("guest")), validResult())),
    assertSucceeds(set(ref(rtdb("host"), resultPath("host")), hostResult))
  ]);
});

test("a false start remains valid if RTDB reaches signal before the local signal is visible", async () => {
  await seedRoom(room({roundStatus: "scheduled"}));
  await assertSucceeds(
    set(ref(rtdb("guest"), resultPath("guest")), falseStartResult())
  );

  await seedRoom(room({roundStatus: "signal"}));
  await assertSucceeds(
    set(ref(rtdb("guest"), resultPath("guest")), falseStartResult())
  );
});
