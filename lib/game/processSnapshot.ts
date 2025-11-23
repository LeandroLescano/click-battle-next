import {
  ParsedGameSnapshot,
  parseGameSnapshot
} from "@leandrolescano/click-battle-core";
import {DataSnapshot} from "firebase/database";

import {breadcrumb, breadcrumbOnce, withSpanMin} from "observability/sentry";

import {reportParseTime, reportSnapshotSize} from "./metrics";

interface ProcessSnapshotResult {
  parsed: ParsedGameSnapshot | null;
  error?: unknown;
}

export const processSnapshot = (
  raw: DataSnapshot,
  key: string | null,
  uid: string | undefined,
  gameID: string
): ProcessSnapshotResult => {
  if (raw) {
    reportSnapshotSize(JSON.stringify(raw).length, gameID);
  }

  breadcrumbOnce(
    "firebase",
    "snapshot_received",
    {gameID, hasData: !!raw},
    2000
  );

  const startParse = performance.now();
  let parsedGame: ParsedGameSnapshot | null = null;

  parsedGame = withSpanMin("parse_snapshot", 8, () =>
    parseGameSnapshot(raw, key, uid)
  );

  reportParseTime(performance.now() - startParse, gameID);

  if (!parsedGame) {
    breadcrumb("navigation", "invalid_game_redirect", {room_id: gameID});
    return {parsed: null};
  }

  return {parsed: parsedGame};
};
