import {User} from "firebase/auth";
import {getFirestore, serverTimestamp, setDoc, doc} from "firebase/firestore";

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
