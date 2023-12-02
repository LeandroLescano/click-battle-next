import {get, getDatabase, ref} from "firebase/database";
import {GameUser} from "interfaces";

export const getUser = async (key: string): Promise<GameUser> => {
  const db = getDatabase();
  const refUser = ref(db, `users/${key}`);
  return await get(refUser).then((snapshot) => ({
    ...snapshot.val(),
    key: snapshot.key
  }));
};

export const getUsers = async (): Promise<GameUser[]> => {
  const db = getDatabase();
  const refUser = ref(db, `users`);
  return await get(refUser).then((snapshot) => ({
    ...snapshot.val(),
    key: snapshot.key
  }));
};
