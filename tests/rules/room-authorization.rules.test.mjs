import test from "node:test";
import assert from "node:assert/strict";
import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, rtdb, ref, room, seedRoom, set, update} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());
test.beforeEach(async () => seedRoom(room()));

test("existing rooms cannot be replaced and owner identity is immutable", async () => {
  await assertFails(set(ref(rtdb("guest"), "games/room-1"), room()));
  await assertFails(update(ref(rtdb("host"), "games/room-1/ownerUser"), {key: "guest"}));
});

test("only the owner renews the host lease and writes its disconnect signal", async () => {
  await assertSucceeds(update(ref(rtdb("host"), "games/room-1/hostLease"), {ownerId: "host", sessionId: "session-1", claimedAt: 1, lastRenewedAt: 2}));
  await assertFails(update(ref(rtdb("guest"), "games/room-1/hostLease"), {ownerId: "guest"}));
  await assertSucceeds(set(ref(rtdb("host"), "roomHostDisconnects/room-1/session-1"), {disconnectedAt: 3}));
  await assertFails(set(ref(rtdb("guest"), "roomHostDisconnects/room-1/session-1"), {disconnectedAt: 3}));
});
