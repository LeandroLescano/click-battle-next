import {get, getDatabase, ref} from "firebase/database";
import {User} from "interfaces";

const db = getDatabase();

export const getUser = async (key: string): Promise<User> => {
  const refUser = ref(db, `users/${key}`);
  return await get(refUser).then((snapshot) => ({
    ...snapshot.val(),
    key: snapshot.key
  }));
};

export const getUsers = async (): Promise<User[]> => {
  const refUser = ref(db, `users`);
  return await get(refUser).then((snapshot) => ({
    ...snapshot.val(),
    key: snapshot.key
  }));
};
