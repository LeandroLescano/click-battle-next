import {addDoc, collection, getFirestore} from "firebase/firestore";
import {RoomStats} from "interfaces/RoomStats";

const PATH = "rooms";

export const addRoomStats = async (roomStats: RoomStats) => {
  const roomsCollection = collection(getFirestore(), PATH);

  await addDoc(roomsCollection, roomStats);
};
