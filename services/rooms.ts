import {
  addDoc,
  collection,
  getFirestore,
  getDocs,
  query,
  orderBy,
  where
} from "firebase/firestore";
import {RoomStats} from "interfaces/RoomStats";

const PATH = "rooms";

export const addRoomStats = async (roomStats: RoomStats) => {
  const roomsCollection = collection(getFirestore(), PATH);

  await addDoc(roomsCollection, roomStats);
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
      rooms.push({
        ...roomData,
        created: roomData.created.toDate(),
        removed: roomData.removed.toDate(),
        id: room.id
      } as RoomStats);
    });
  });

  return rooms;
};
