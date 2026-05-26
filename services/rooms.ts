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
      gameMode: getStatsGameMode(game.gameMode ?? roomGameMode),
      maxClicks: game.maxClicks ?? 0,
      numberOfUsers: game.numberOfUsers ?? 0,
      timer: game.timer ?? 0
    }));
};

const getRoomStatsDocumentData = (roomStats: RoomStats) => {
  const {id: _id, gamesPlayed, ...roomData} = roomStats;

  return {
    ...roomData,
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
    q = query(q, where("created", "<=", new Date(endDate)));
  }

  await getDocs(q).then((snapshot) => {
    if (snapshot.docs.length === 0) return [];

    snapshot.docs.forEach((room) => {
      const roomData = room.data();
      const gameMode = getStatsGameMode(roomData.gameMode);
      const created = toStatsDate(roomData.created);
      rooms.push({
        ...roomData,
        created,
        gamesPlayed: getStatsGamesPlayed(roomData.gamesPlayed, gameMode),
        gameMode,
        removed: toStatsDate(roomData.removed, created),
        id: room.id
      } as RoomStats);
    });
  });

  return rooms;
};
