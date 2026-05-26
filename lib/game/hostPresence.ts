export const HOST_DISCONNECT_GRACE_MS = 30 * 1000;

export const getHostDisconnectRemovalDelay = (
  hostDisconnectedAt?: unknown,
  now = Date.now()
) => {
  if (typeof hostDisconnectedAt !== "number") {
    return null;
  }

  return Math.max(0, HOST_DISCONNECT_GRACE_MS - (now - hostDisconnectedAt));
};

export const isHostDisconnectStale = (
  hostDisconnectedAt?: unknown,
  now = Date.now()
) => getHostDisconnectRemovalDelay(hostDisconnectedAt, now) === 0;
