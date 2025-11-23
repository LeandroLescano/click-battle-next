import {metricGauge, metricGaugeOnce, metricTiming} from "observability/sentry";

export const reportSnapshotSize = (sizeBytes: number, roomId: string) => {
  metricGauge("snapshot_size_bytes", sizeBytes, {room_id: roomId}, 0.1);
};

export const reportParseTime = (durationMs: number, roomId: string) => {
  metricTiming("snapshot_parse_time_ms", durationMs, {room_id: roomId}, 0.1);
};

export const reportHostMetrics = (
  usersCount: number,
  roomId: string,
  isHost: boolean
) => {
  if (!isHost) return;

  const roomTags = {room_id: roomId, is_host: "1"};

  metricGaugeOnce("snapshot_users_count", usersCount, roomTags, 0.1);
  metricGaugeOnce("room_users_count", usersCount, roomTags, 0.1);
};

export const reportApplyStateTime = (
  durationMs: number,
  roomId: string,
  isHost: boolean
) => {
  const roomTags = {room_id: roomId, is_host: isHost ? "1" : "0"};

  metricTiming("local_state_apply_ms", durationMs, roomTags, 0.1);
};
