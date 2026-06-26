import {
  Database,
  ref,
  runTransaction,
  serverTimestamp,
  update
} from "firebase/database";

import {HostLease, RawRoomLifecycleSnapshot} from "interfaces";

export const HOST_LEASE_HEARTBEAT_MS = 20 * 1000;
export const HOST_LEASE_EXPIRY_MS = 90 * 1000;

const randomToken = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createHostSessionId = (ownerId: string) =>
  `${ownerId}-${randomToken()}`;

export const buildInitialHostLease = (
  ownerId: string,
  sessionId: string
): Omit<HostLease, "claimedAt" | "lastRenewedAt"> & {
  claimedAt: ReturnType<typeof serverTimestamp>;
  lastRenewedAt: ReturnType<typeof serverTimestamp>;
} => ({
  ownerId,
  sessionId,
  claimedAt: serverTimestamp(),
  lastRenewedAt: serverTimestamp()
});

export const getHostLeasePath = (roomId: string) => `games/${roomId}/hostLease`;

export const getHostDisconnectSignalPath = (
  roomId: string,
  sessionId: string
) => `roomHostDisconnects/${roomId}/${sessionId}`;

const isHostLease = (value: unknown): value is HostLease => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HostLease>;

  return (
    typeof candidate.ownerId === "string" &&
    candidate.ownerId.length > 0 &&
    typeof candidate.sessionId === "string" &&
    candidate.sessionId.length > 0 &&
    typeof candidate.claimedAt === "number" &&
    Number.isFinite(candidate.claimedAt) &&
    typeof candidate.lastRenewedAt === "number" &&
    Number.isFinite(candidate.lastRenewedAt)
  );
};

export const renewHostLease = async (
  db: Database,
  roomId: string,
  ownerId: string,
  sessionId: string
) =>
  runTransaction(
    ref(db, getHostLeasePath(roomId)),
    (current: HostLease | null) => {
      if (!isHostLease(current)) {
        return;
      }

      if (current.ownerId !== ownerId || current.sessionId !== sessionId) {
        return;
      }

      return {
        ...current,
        lastRenewedAt: serverTimestamp()
      };
    },
    {applyLocally: false}
  );

export const clearHostDisconnectSignal = async (
  db: Database,
  roomId: string,
  sessionId: string
) =>
  update(ref(db), {
    [getHostDisconnectSignalPath(roomId, sessionId)]: null
  });

export const bootstrapLegacyHostLease = async (
  db: Database,
  roomId: string,
  ownerId: string,
  sessionId: string
) =>
  runTransaction(
    ref(db, `games/${roomId}`),
    (currentRoom: RawRoomLifecycleSnapshot | null) => {
      if (!currentRoom || currentRoom.hostLease) {
        return;
      }

      if (currentRoom.ownerUser?.key !== ownerId) {
        return;
      }

      return {
        ...currentRoom,
        hostLease: buildInitialHostLease(ownerId, sessionId)
      };
    },
    {applyLocally: false}
  );

export const replaceHostLeaseSession = async (
  db: Database,
  roomId: string,
  ownerId: string,
  sessionId: string
) =>
  runTransaction(
    ref(db, getHostLeasePath(roomId)),
    (current: HostLease | null) => {
      if (!isHostLease(current)) {
        return;
      }

      if (current.ownerId !== ownerId || current.sessionId === sessionId) {
        return;
      }

      return {
        ...current,
        sessionId,
        claimedAt: serverTimestamp(),
        lastRenewedAt: serverTimestamp()
      };
    },
    {applyLocally: false}
  );
