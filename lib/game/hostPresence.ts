import {HOST_LEASE_EXPIRY_MS} from "./hostLease";

export const HOST_DISCONNECT_GRACE_MS = 30 * 1000;
export const LEGACY_ROOM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type RoomLifecycleState = "active" | "pending" | "stale" | "unknown";

export type RoomLifecycleReason =
  | "lease-active"
  | "disconnect-grace"
  | "host-disconnected"
  | "lease-expired"
  | "legacy-age"
  | "insufficient-evidence";

export type RoomLifecycleAssessment = {
  cleanupAt: number | null;
  expectedSessionId: string | null;
  mayDelete: boolean;
  observedDisconnectedAt: number | null;
  reason: RoomLifecycleReason;
  state: RoomLifecycleState;
};

type RoomPresenceSnapshot = {
  created?: unknown;
  hostConnectionId?: unknown;
  hostDisconnectedAt?: unknown;
  hostDisconnectSignal?: unknown;
  hostLease?: unknown;
};

type HostLease = {
  ownerId: string;
  sessionId: string;
  claimedAt: number;
  lastRenewedAt: number;
};

type HostDisconnectSignal = {
  disconnectedAt: number;
};

const isFiniteTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const hasHostConnection = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isHostLease = (value: unknown): value is HostLease => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HostLease>;

  return (
    typeof candidate.ownerId === "string" &&
    candidate.ownerId.trim().length > 0 &&
    typeof candidate.sessionId === "string" &&
    candidate.sessionId.trim().length > 0 &&
    isFiniteTimestamp(candidate.claimedAt) &&
    isFiniteTimestamp(candidate.lastRenewedAt)
  );
};

const isHostDisconnectSignal = (
  value: unknown
): value is HostDisconnectSignal => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HostDisconnectSignal>;

  return isFiniteTimestamp(candidate.disconnectedAt);
};

export const assessRoomLifecycle = (
  room: RoomPresenceSnapshot,
  now = Date.now()
): RoomLifecycleAssessment => {
  const lease = isHostLease(room.hostLease) ? room.hostLease : null;
  const matchingDisconnectSignal = isHostDisconnectSignal(
    room.hostDisconnectSignal
  )
    ? room.hostDisconnectSignal
    : null;

  if (lease) {
    const leaseCleanupAt = lease.lastRenewedAt + HOST_LEASE_EXPIRY_MS;
    const signalDisconnectAt = matchingDisconnectSignal?.disconnectedAt ?? null;

    if (
      signalDisconnectAt !== null &&
      signalDisconnectAt >= lease.lastRenewedAt
    ) {
      const cleanupAt = signalDisconnectAt + HOST_DISCONNECT_GRACE_MS;

      if (now < cleanupAt) {
        return {
          cleanupAt,
          expectedSessionId: lease.sessionId,
          mayDelete: false,
          observedDisconnectedAt: signalDisconnectAt,
          reason: "disconnect-grace",
          state: "pending"
        };
      }

      return {
        cleanupAt: null,
        expectedSessionId: lease.sessionId,
        mayDelete: true,
        observedDisconnectedAt: signalDisconnectAt,
        reason: "host-disconnected",
        state: "stale"
      };
    }

    if (now < leaseCleanupAt) {
      return {
        cleanupAt: leaseCleanupAt,
        expectedSessionId: lease.sessionId,
        mayDelete: false,
        observedDisconnectedAt: null,
        reason: "lease-active",
        state: "active"
      };
    }

    return {
      cleanupAt: null,
      expectedSessionId: lease.sessionId,
      mayDelete: true,
      observedDisconnectedAt: null,
      reason: "lease-expired",
      state: "stale"
    };
  }

  if (isFiniteTimestamp(room.hostDisconnectedAt)) {
    const cleanupAt = room.hostDisconnectedAt + HOST_DISCONNECT_GRACE_MS;

    if (now < cleanupAt) {
      return {
        cleanupAt,
        expectedSessionId: null,
        mayDelete: false,
        observedDisconnectedAt: room.hostDisconnectedAt,
        reason: "disconnect-grace",
        state: "pending"
      };
    }

    return {
      cleanupAt: null,
      expectedSessionId: null,
      mayDelete: true,
      observedDisconnectedAt: room.hostDisconnectedAt,
      reason: "host-disconnected",
      state: "stale"
    };
  }

  const hasLegacyDisconnectEvidence =
    room.hostDisconnectedAt !== null && room.hostDisconnectedAt !== undefined;

  if (!hasLegacyDisconnectEvidence && isFiniteTimestamp(room.created)) {
    const cleanupAt = room.created + LEGACY_ROOM_MAX_AGE_MS;

    if (now >= cleanupAt) {
      return {
        cleanupAt: null,
        expectedSessionId: null,
        mayDelete: true,
        observedDisconnectedAt: null,
        reason: "legacy-age",
        state: "stale"
      };
    }

    return {
      cleanupAt,
      expectedSessionId: null,
      mayDelete: false,
      observedDisconnectedAt: null,
      reason: "insufficient-evidence",
      state: "unknown"
    };
  }

  if (hasHostConnection(room.hostConnectionId)) {
    return {
      cleanupAt: isFiniteTimestamp(room.created)
        ? room.created + LEGACY_ROOM_MAX_AGE_MS
        : null,
      expectedSessionId: null,
      mayDelete: false,
      observedDisconnectedAt: null,
      reason: "insufficient-evidence",
      state: "unknown"
    };
  }

  return {
    cleanupAt: null,
    expectedSessionId: null,
    mayDelete: false,
    observedDisconnectedAt: null,
    reason: "insufficient-evidence",
    state: "unknown"
  };
};

export const getHostDisconnectRemovalDelay = (
  hostDisconnectedAt?: unknown,
  now = Date.now()
) => {
  if (!isFiniteTimestamp(hostDisconnectedAt)) {
    return null;
  }

  return Math.max(0, HOST_DISCONNECT_GRACE_MS - (now - hostDisconnectedAt));
};

export const isHostDisconnectStale = (
  hostDisconnectedAt?: unknown,
  now = Date.now()
) => getHostDisconnectRemovalDelay(hostDisconnectedAt, now) === 0;
