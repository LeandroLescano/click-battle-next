import test from "node:test";
import assert from "node:assert/strict";
import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import {
  cleanupRulesEnvironment,
  createRulesEnvironment,
  rtdb,
  ref,
  remove,
  room,
  seedRoom,
  set,
  update
} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());
test.beforeEach(async () => seedRoom(room()));

test("only the host can switch between supported modes in an idle lobby", async () => {
  const switchableRoom = room({mode: "classic-speed"});
  delete switchableRoom.reactionCurrentRoundId;
  delete switchableRoom.reactionRounds;
  switchableRoom.modeSettings = {gameMode: "classic-speed", config: {}};
  await seedRoom(switchableRoom);

  const reactionSettings = {gameMode: "reaction", config: {windowMs: 1500}};
  await assertFails(
    update(ref(rtdb("guest"), "games/room-1"), {
      gameMode: "reaction",
      modeSettings: reactionSettings
    })
  );
  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1"), {
      gameMode: "reaction",
      modeSettings: reactionSettings
    })
  );
  await assertFails(
    update(ref(rtdb("host"), "games/room-1"), {
      gameMode: "precision",
      modeSettings: {gameMode: "precision", config: {targetCount: 10}}
    })
  );
});

test("mode switches are blocked once a reaction round is active", async () => {
  await assertFails(
    update(ref(rtdb("host"), "games/room-1"), {
      gameMode: "classic-speed",
      modeSettings: {gameMode: "classic-speed", config: {}}
    })
  );
});

test("existing rooms cannot be replaced and owner identity is immutable", async () => {
  await assertFails(set(ref(rtdb("guest"), "games/room-1"), room()));
  await assertFails(
    update(ref(rtdb("host"), "games/room-1/ownerUser"), {key: "guest"})
  );
});

test("only the owner renews the host lease and writes its disconnect signal", async () => {
  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1/hostLease"), {
      ownerId: "host",
      sessionId: "session-1",
      claimedAt: 1,
      lastRenewedAt: 2
    })
  );
  await assertFails(
    update(ref(rtdb("guest"), "games/room-1/hostLease"), {ownerId: "guest"})
  );
  await assertSucceeds(
    set(ref(rtdb("host"), "roomHostDisconnects/room-1/session-1"), {
      disconnectedAt: 3
    })
  );
  await assertFails(
    set(ref(rtdb("guest"), "roomHostDisconnects/room-1/session-1"), {
      disconnectedAt: 3
    })
  );
});

test("authenticated viewers convert only expired rooms to cleanup tombstones", async () => {
  const tombstone = {
    cleanupTombstone: {
      closedAt: 90_001,
      version: 1
    }
  };

  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1/hostLease"), {
      ownerId: "host",
      sessionId: "session-1",
      claimedAt: Date.now(),
      lastRenewedAt: Date.now()
    })
  );
  await assertFails(set(ref(rtdb("guest"), "games/room-1"), tombstone));

  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1/hostLease"), {
      ownerId: "host",
      sessionId: "session-1",
      claimedAt: 1,
      lastRenewedAt: 1
    })
  );
  await assertSucceeds(
    set(ref(rtdb("host"), "roomHostDisconnects/room-1/session-1"), {
      disconnectedAt: 2
    })
  );
  await assertSucceeds(set(ref(rtdb("guest"), "games/room-1"), tombstone));
  await assertSucceeds(remove(ref(rtdb("guest"), "games/room-1")));
  await assertSucceeds(
    remove(ref(rtdb("guest"), "roomHostDisconnects/room-1"))
  );
});

test("cleanup tombstones cannot retain or alter room fields", async () => {
  const tombstone = {
    cleanupTombstone: {
      closedAt: 90_001,
      version: 1
    },
    ...room()
  };

  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1/hostLease"), {
      ownerId: "host",
      sessionId: "session-1",
      claimedAt: 1,
      lastRenewedAt: 1
    })
  );
  await assertFails(set(ref(rtdb("guest"), "games/room-1"), tombstone));
});

test("a confirmed disconnect closes before lease expiry only after its grace", async () => {
  const recentRenewal = Date.now() - 6_000;
  const recentDisconnect = recentRenewal + 1_000;
  const recentTombstone = {
    cleanupTombstone: {
      closedAt: recentDisconnect + 30_000,
      version: 1
    }
  };

  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1/hostLease"), {
      ownerId: "host",
      sessionId: "session-1",
      claimedAt: recentRenewal,
      lastRenewedAt: recentRenewal
    })
  );
  await assertSucceeds(
    set(ref(rtdb("host"), "roomHostDisconnects/room-1/session-1"), {
      disconnectedAt: recentDisconnect
    })
  );
  await assertFails(set(ref(rtdb("guest"), "games/room-1"), recentTombstone));

  const lastRenewedAt = Date.now() - 32_000;
  const disconnectedAt = lastRenewedAt + 1_000;
  const tombstone = {
    cleanupTombstone: {
      closedAt: disconnectedAt + 30_000,
      version: 1
    }
  };

  await assertSucceeds(
    update(ref(rtdb("host"), "games/room-1/hostLease"), {
      ownerId: "host",
      sessionId: "session-1",
      claimedAt: lastRenewedAt,
      lastRenewedAt
    })
  );
  await assertSucceeds(
    set(ref(rtdb("host"), "roomHostDisconnects/room-1/session-1"), {
      disconnectedAt
    })
  );
  await assertSucceeds(set(ref(rtdb("guest"), "games/room-1"), tombstone));
});

test("users may write only their own RTDB profile", async () => {
  await assertSucceeds(
    set(ref(rtdb("guest"), "users/guest"), {nickname: "Guest"})
  );
  await assertFails(set(ref(rtdb("guest"), "users/host"), {nickname: "Host"}));
});
