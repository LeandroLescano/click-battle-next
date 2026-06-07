import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getFirestore,
  getDocs,
  query,
  orderBy,
  setDoc,
  where
} from "firebase/firestore";

import {RoomStats} from "interfaces/RoomStats";
import {DEFAULT_GAME_MODE} from "lib/game/gameModes";

const PATH = "rooms";

const getStatsGameMode = (mode: unknown) =>
  mode === "reaction" || mode === "classic-speed" ? mode : DEFAULT_GAME_MODE;

const toStatsDate = (value: unknown, fallback = new Date()) => {
  if (value instanceof Date) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  const parsed = value ? new Date(value as string | number) : fallback;

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const getValidDates = (dates: Array<Date | undefined>) =>
  dates.filter(
    (date): date is Date =>
      date instanceof Date && !Number.isNaN(date.getTime())
  );

const getFirstDate = (dates: Date[]) =>
  dates.length > 0
    ? new Date(Math.min(...dates.map((date) => date.getTime())))
    : undefined;

const getLastDate = (dates: Date[]) =>
  dates.length > 0
    ? new Date(Math.max(...dates.map((date) => date.getTime())))
    : undefined;

const getStatsGamesPlayed = (
  gamesPlayed: unknown,
  roomGameMode: RoomStats["gameMode"]
): RoomStats["gamesPlayed"] => {
  if (!Array.isArray(gamesPlayed)) {
    return [];
  }

  return gamesPlayed
    .filter((game): game is Partial<RoomStats["gamesPlayed"][number]> =>
      Boolean(game && typeof game === "object")
    )
    .map((game) => ({
      ...game,
      finishedAt: game.finishedAt
        ? toStatsDate(game.finishedAt)
        : game.finishedAt,
      startedAt: game.startedAt ? toStatsDate(game.startedAt) : game.startedAt,
      gameMode: getStatsGameMode(game.gameMode ?? roomGameMode),
      maxClicks: game.maxClicks ?? 0,
      numberOfUsers: game.numberOfUsers ?? 0,
      timer: game.timer ?? 0
    }));
};

const getRoomStatsDocumentData = (roomStats: RoomStats) => {
  const {id: _id, gamesPlayed, ...roomData} = roomStats;
  const startedDates = getValidDates(gamesPlayed.map((game) => game.startedAt));
  const finishedDates = getValidDates(
    gamesPlayed.map((game) => game.finishedAt)
  );
  const durationSeconds = Math.max(
    0,
    Math.round((roomData.removed.getTime() - roomData.created.getTime()) / 1000)
  );
  const firstGameStartedAt = getFirstDate(startedDates);
  const lastGameFinishedAt = getLastDate(finishedDates);

  return {
    ...roomData,
    durationSeconds,
    hadAnyGame: gamesPlayed.length > 0,
    ...(firstGameStartedAt ? {firstGameStartedAt} : {}),
    ...(lastGameFinishedAt ? {lastGameFinishedAt} : {}),
    roundsPlayed: gamesPlayed.length,
    ...(gamesPlayed.length > 0 ? {gamesPlayed: arrayUnion(...gamesPlayed)} : {})
  };
};

export const addRoomStats = async (roomStats: RoomStats) => {
  const db = getFirestore();

  if (!roomStats.id) {
    await addDoc(collection(db, PATH), roomStats);
    return;
  }

  await setDoc(
    doc(db, PATH, roomStats.id),
    getRoomStatsDocumentData(roomStats),
    {
      merge: true
    }
  );
};

export const getRoomStats = async (
  startDate?: string | null,
  endDate?: string | null
): Promise<RoomStats[]> => {
  const roomsCollection = collection(getFirestore(), PATH);
  let q = query(roomsCollection, orderBy("created", "desc"));
  const rooms: RoomStats[] = [];

  if (startDate) {
    q = query(q, where("created", ">=", new Date(startDate)));
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    q = query(q, where("created", "<=", endOfDay));
  }

  await getDocs(q).then((snapshot) => {
    if (snapshot.docs.length === 0) return [];

    snapshot.docs.forEach((room) => {
      const roomData = room.data();
      const gameMode = getStatsGameMode(roomData.gameMode);
      const created = toStatsDate(roomData.created);
      const gamesPlayed = getStatsGamesPlayed(roomData.gamesPlayed, gameMode);
      const removed = toStatsDate(roomData.removed, created);
      rooms.push({
        ...roomData,
        created,
        durationSeconds:
          roomData.durationSeconds ??
          Math.max(
            0,
            Math.round((removed.getTime() - created.getTime()) / 1000)
          ),
        firstGameStartedAt: roomData.firstGameStartedAt
          ? toStatsDate(roomData.firstGameStartedAt)
          : undefined,
        gamesPlayed,
        gameMode,
        hadAnyGame: roomData.hadAnyGame ?? gamesPlayed.length > 0,
        lastGameFinishedAt: roomData.lastGameFinishedAt
          ? toStatsDate(roomData.lastGameFinishedAt)
          : undefined,
        maxUsersConfigured:
          roomData.maxUsersConfigured ?? roomData.maxUsersConnected,
        removed,
        roundsPlayed: roomData.roundsPlayed ?? gamesPlayed.length,
        id: room.id
      } as RoomStats);
    });
  });

  return rooms;
};
