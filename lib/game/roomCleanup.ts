import {Database, ref, remove, runTransaction} from "firebase/database";

import {HostDisconnectSignal, RoomLifecycleSnapshot} from "interfaces";

import {assessRoomLifecycle} from "./hostPresence";

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
  const result = await runTransaction(
    ref(db, `games/${roomKey}`),
    (currentRoom: RoomLifecycleSnapshot | null) => {
      if (!currentRoom) {
        return;
      }

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
        getServerNow()
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

      return null;
    },
    {applyLocally: false}
  );

  if (result.committed) {
    remove(ref(db, `roomHostDisconnects/${roomKey}`)).catch(console.error);
  }

  return result.committed;
};
