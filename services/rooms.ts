import {
  addDoc,
  collection,
  getFirestore,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import {RoomStats} from "interfaces/RoomStats";

const PATH = "rooms";

export const addRoomStats = async (roomStats: RoomStats) => {
  const roomsCollection = collection(getFirestore(), PATH);

  await addDoc(roomsCollection, roomStats);
};

export const getRoomStats = async (): Promise<RoomStats[]> => {
  const roomsCollection = collection(getFirestore(), PATH);
  const q = query(roomsCollection, orderBy("created", "desc"));
  const rooms: RoomStats[] = [];

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
