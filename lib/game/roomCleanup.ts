import {Database, ref, remove, runTransaction} from "firebase/database";

import {
  HostDisconnectSignal,
  RoomCleanupTombstone,
  RoomLifecycleSnapshot
} from "interfaces";

import {HOST_LEASE_EXPIRY_MS} from "./hostLease";
import {
  HOST_DISCONNECT_GRACE_MS,
  LEGACY_ROOM_MAX_AGE_MS,
  assessRoomLifecycle
} from "./hostPresence";

type RawRoomSnapshot = RoomLifecycleSnapshot & Record<string, unknown>;

const finiteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;

const parseCleanupTombstone = (room: unknown): RoomCleanupTombstone | null => {
  if (!room || typeof room !== "object") {
    return null;
  }

  const tombstone = (room as {cleanupTombstone?: unknown}).cleanupTombstone;

  if (!tombstone || typeof tombstone !== "object") {
    return null;
  }

  const candidate = tombstone as Partial<RoomCleanupTombstone>;
  const closedAt = finiteNumber(candidate.closedAt);

  return candidate.version === 1 && closedAt !== null
    ? {closedAt, version: 1}
    : null;
};

const getCleanupTimestamp = (
  room: RawRoomSnapshot,
  assessment: ReturnType<typeof assessRoomLifecycle>,
  now: number
) => {
  if (
    assessment.reason === "host-disconnected" &&
    assessment.observedDisconnectedAt !== null
  ) {
    return assessment.observedDisconnectedAt + HOST_DISCONNECT_GRACE_MS;
  }

  const lease =
    room.hostLease && typeof room.hostLease === "object"
      ? (room.hostLease as Record<string, unknown>)
      : null;
  const lastRenewedAt = finiteNumber(lease?.lastRenewedAt);

  if (assessment.reason === "lease-expired" && lastRenewedAt !== null) {
    return lastRenewedAt + HOST_LEASE_EXPIRY_MS;
  }

  const created = finiteNumber(room.created);

  if (assessment.reason === "legacy-age" && created !== null) {
    return created + LEGACY_ROOM_MAX_AGE_MS;
  }

  return now;
};

const buildCleanupTombstone = (
  room: RawRoomSnapshot,
  assessment: ReturnType<typeof assessRoomLifecycle>,
  now: number
): RoomCleanupTombstone => {
  return {
    closedAt: getCleanupTimestamp(room, assessment, now),
    version: 1
  };
};

export type RoomSnapshotEntry<T extends RoomLifecycleSnapshot> = [string, T];

export type RoomSnapshotPartition<T extends RoomLifecycleSnapshot> = {
  nextEvaluationAt: number | null;
  staleRoomKeys: string[];
  visibleEntries: RoomSnapshotEntry<T>[];
};

export const partitionRoomSnapshots = <T extends RoomLifecycleSnapshot>(
  rooms: Record<string, T> | null,
  disconnectSignals: Record<
    string,
    Record<string, HostDisconnectSignal>
  > | null,
  now: number
): RoomSnapshotPartition<T> => {
  const result: RoomSnapshotPartition<T> = {
    nextEvaluationAt: null,
    staleRoomKeys: [],
    visibleEntries: []
  };

  if (!rooms) {
    return result;
  }

  Object.entries(rooms).forEach(([key, room]) => {
    const sessionId =
      room.hostLease &&
      typeof room.hostLease === "object" &&
      typeof (room.hostLease as {sessionId?: unknown}).sessionId === "string"
        ? (room.hostLease as {sessionId: string}).sessionId
        : null;
    const assessment = assessRoomLifecycle(
      {
        ...room,
        hostDisconnectSignal: sessionId
          ? disconnectSignals?.[key]?.[sessionId] ?? null
          : null
      },
      now
    );

    if (assessment.mayDelete) {
      result.staleRoomKeys.push(key);
      return;
    }

    result.visibleEntries.push([key, room]);

    if (
      assessment.cleanupAt !== null &&
      (result.nextEvaluationAt === null ||
        assessment.cleanupAt < result.nextEvaluationAt)
    ) {
      result.nextEvaluationAt = assessment.cleanupAt;
    }
  });

  return result;
};

export const deleteRoomIfStillStale = async (
  db: Database,
  roomKey: string,
  getServerNow: () => number,
  options?: {
    expectedSessionId?: string | null;
    observedDisconnectedAt?: number | null;
  }
) => {
  let acceptedTombstone: RoomCleanupTombstone | null = null;
  const result = await runTransaction(
    ref(db, `games/${roomKey}`),
    (currentRoom: RawRoomSnapshot | null) => {
      acceptedTombstone = null;

      if (!currentRoom) {
        return;
      }

      const existingTombstone = parseCleanupTombstone(currentRoom);

      if (existingTombstone) {
        acceptedTombstone = existingTombstone;
        return;
      }

      const now = getServerNow();
      const assessment = assessRoomLifecycle(
        {
          ...currentRoom,
          hostDisconnectSignal:
            options?.observedDisconnectedAt !== null &&
            options?.observedDisconnectedAt !== undefined
              ? {
                  disconnectedAt: options.observedDisconnectedAt
                }
              : null
        },
        now
      );

      if (!assessment.mayDelete) {
        return;
      }

      if (
        options?.expectedSessionId &&
        assessment.expectedSessionId !== options.expectedSessionId
      ) {
        return;
      }

      if (
        options?.observedDisconnectedAt !== null &&
        options?.observedDisconnectedAt !== undefined &&
        assessment.observedDisconnectedAt !== options.observedDisconnectedAt
      ) {
        return;
      }

      acceptedTombstone = buildCleanupTombstone(currentRoom, assessment, now);

      return {cleanupTombstone: acceptedTombstone};
    },
    {applyLocally: false}
  );

  const tombstone =
    parseCleanupTombstone(result.snapshot.val()) ?? acceptedTombstone;

  if (!tombstone) {
    return false;
  }

  await remove(ref(db, `games/${roomKey}`));
  await remove(ref(db, `roomHostDisconnects/${roomKey}`)).catch(console.error);

  return true;
};
