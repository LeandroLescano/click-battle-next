import test from "node:test";
import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, remove, rtdb, ref, room, seedRoom, set} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());
test.beforeEach(async () => seedRoom(room({roundStatus: "scheduled"})));

test("only host can create and transition a secure round", async () => {
  await assertFails(set(ref(rtdb("guest"), "games/room-1/reactionRounds/round-2"), {roundId: "round-2", status: "scheduled", windowMs: 5000}));
  await assertSucceeds(set(ref(rtdb("host"), "games/room-1/reactionRounds/round-2"), {roundId: "round-2", status: "scheduled", windowMs: 5000}));
  await assertFails(set(ref(rtdb("guest"), "games/room-1/reactionRounds/round-1/status"), "signal"));
  await assertSucceeds(set(ref(rtdb("host"), "games/room-1/reactionRounds/round-1/status"), "signal"));
  await assertSucceeds(set(ref(rtdb("host"), "games/room-1/reactionRounds/round-1/status"), "ended"));
});

test("the host can remove an unactivated round after activation fails", async () => {
  await assertSucceeds(
    set(ref(rtdb("host"), "games/room-1/reactionRounds/orphan"), {
      roundId: "orphan",
      status: "scheduled",
      windowMs: 5000
    })
  );
  await assertSucceeds(
    remove(ref(rtdb("host"), "games/room-1/reactionRounds/orphan"))
  );
  await assertFails(
    remove(ref(rtdb("host"), "games/room-1/reactionRounds/round-1"))
  );
});
