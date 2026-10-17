import type {GameMode} from "@leandrolescano/click-battle-core";

export type RoomGameMode = Extract<GameMode, "classic-speed" | "reaction">;

type RoomGameModeSource = {
  gameMode?: GameMode;
  gamesPlayed: Array<{gameMode?: GameMode}>;
};

export type RoomGameModeCount = {
  gameMode: RoomGameMode;
  gamesPlayed: number;
};

const DEFAULT_ROOM_GAME_MODE: RoomGameMode = "classic-speed";

const normalizeGameMode = (mode?: GameMode): RoomGameMode =>
  mode === "reaction" || mode === "classic-speed"
    ? mode
    : DEFAULT_ROOM_GAME_MODE;

export const getRoomGameModeBreakdown = ({
  gameMode,
  gamesPlayed
}: RoomGameModeSource): RoomGameModeCount[] => {
  if (gamesPlayed.length === 0) {
    return [{gameMode: normalizeGameMode(gameMode), gamesPlayed: 0}];
  }

  const counts = new Map<RoomGameMode, number>();
  const fallbackMode = normalizeGameMode(gameMode);

  for (const game of gamesPlayed) {
    const mode = normalizeGameMode(game.gameMode ?? fallbackMode);
    counts.set(mode, (counts.get(mode) ?? 0) + 1);
  }

  return [...counts.entries()].map(([gameMode, gamesPlayed]) => ({
    gameMode,
    gamesPlayed
  }));
};
