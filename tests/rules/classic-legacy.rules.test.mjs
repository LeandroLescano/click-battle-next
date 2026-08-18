import test from "node:test";
import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, rtdb, ref, room, seedRoom, set} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());
test.beforeEach(async () => seedRoom(room({mode: "classic-speed", roundStatus: "waiting"})));

test("classic players retain only their own input and host remains kick authority", async () => {
  await assertSucceeds(set(ref(rtdb("guest"), "games/room-1/listUsers/guest/clicks"), 1));
  await assertFails(set(ref(rtdb("guest"), "games/room-1/listUsers/host/clicks"), 1));
  await assertSucceeds(set(ref(rtdb("host"), "games/room-1/listUsers/guest/kickOut"), true));
  await assertFails(set(ref(rtdb("guest"), "games/room-1/listUsers/host/kickOut"), true));
});
