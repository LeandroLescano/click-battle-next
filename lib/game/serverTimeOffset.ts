import {getDatabase, onValue, ref} from "firebase/database";
import {useEffect, useState} from "react";

export const estimateServerNow = (offsetMs: number) => Date.now() + offsetMs;

export const useServerTimeOffset = () => {
  const [offsetMs, setOffsetMs] = useState(0);

  useEffect(() => {
    const db = getDatabase();
    const offsetRef = ref(db, ".info/serverTimeOffset");

    return onValue(offsetRef, (snapshot) => {
      const nextOffset = snapshot.val();
      setOffsetMs(typeof nextOffset === "number" ? nextOffset : 0);
    });
  }, []);

  return offsetMs;
};
