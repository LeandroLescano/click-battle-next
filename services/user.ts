import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where
} from "firebase/firestore";

import {GameUser} from "interfaces";

const PATH = "users";

export const getUser = async (key: string): Promise<GameUser> => {
  const userDoc = doc(getFirestore(), PATH, key);
  return await getDoc(userDoc).then((snapshot) => ({
    ...(snapshot.data() as GameUser),
    key: snapshot.id
  }));
};

export const getUserByEmail = async (
  email: string
): Promise<GameUser | null> => {
  const usersCollection = collection(getFirestore(), PATH);
  const q = query(usersCollection, where("email", "==", email));

  return await getDocs(q).then((snapshot) => {
    if (snapshot.empty) return null;

    return {
      ...(snapshot.docs[0].data() as GameUser),
      key: snapshot.docs[0].id
    };
  });
};

export const isUsernameAvailable = async (
  username: string
): Promise<boolean> => {
  const usersCollection = collection(getFirestore(), PATH);
  const q = query(usersCollection, where("username", "==", username));

  return await getDocs(q).then((snapshot) => {
    return snapshot.empty;
  });
};

export const getUsers = async (): Promise<GameUser[]> => {
  const usersCollection = collection(getFirestore(), PATH);
  const gameUsers: GameUser[] = [];

  await getDocs(usersCollection).then((snapshot) => {
    snapshot.forEach((child) => {
      gameUsers.push({
        ...(child.data() as Exclude<GameUser, "key">),
        key: child.id
      });
    });
  });

  return gameUsers;
};

export const addUser = async (user: GameUser): Promise<string | null> => {
  const usersCollection = collection(getFirestore(), PATH);
  const generatedKey = (await addDoc(usersCollection, user)).id;

  return generatedKey;
};

export const updateUser = async (key: string, user: Partial<GameUser>) => {
  const userDoc = doc(getFirestore(), PATH, key);
  console.log({key, user});
  await updateDoc(userDoc, {...user});
};
