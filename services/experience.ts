import {User} from "firebase/auth";
import {
  getFirestore,
  serverTimestamp,
  setDoc,
  doc,
  collection,
  getDocs
} from "firebase/firestore";
import {DesignPreference} from "interfaces/DesignPreferences";

const PATH = "designPreferences";

export const addDesignPreferences = async (
  likesNewDesign: boolean,
  user: User
) => {
  const userDoc = doc(getFirestore(), PATH, user.uid);

  await setDoc(userDoc, {
    likesNewDesign,
    isAnonymous: user.isAnonymous,
    timestamp: serverTimestamp()
  });
};

export const getDesignPreferences = async (): Promise<
  DesignPreference[] | null
> => {
  const preferencesCollection = collection(getFirestore(), PATH);

  return await getDocs(preferencesCollection).then((snapshot) => {
    if (snapshot.empty) return null;

    return snapshot.docs.map((doc) => doc.data() as DesignPreference);
  });
};
