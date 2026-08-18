import {getDatabase, onValue, ref} from "firebase/database";
import {useEffect, useState} from "react";

export const estimateServerNow = (offsetMs: number) => Date.now() + offsetMs;

export type ServerTimeOffsetState = {
  offsetMs: number;
  isReady: boolean;
};

export const getServerTimeOffsetState = (
  value: unknown
): ServerTimeOffsetState =>
  typeof value === "number" && Number.isFinite(value)
    ? {offsetMs: value, isReady: true}
    : {offsetMs: 0, isReady: false};

export const useServerTimeOffset = () => {
  const [state, setState] = useState<ServerTimeOffsetState>({
    offsetMs: 0,
    isReady: false
  });

  useEffect(() => {
    const db = getDatabase();
    const offsetRef = ref(db, ".info/serverTimeOffset");

    return onValue(
      offsetRef,
      (snapshot) => setState(getServerTimeOffsetState(snapshot.val())),
      () => setState({offsetMs: 0, isReady: false})
    );
  }, []);

  return state;
};
