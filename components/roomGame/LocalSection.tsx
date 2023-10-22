import React, {useState} from "react";
import {GameUser} from "interfaces";
import {getDatabase, ref, update} from "firebase/database";
import {useRouter} from "next/router";
import {useAuth} from "contexts/AuthContext";

interface LocalSectionProps {
  idGame: string;
  isLocal: boolean;
  localUser: GameUser;
  start: boolean;
  startCountdown: boolean;
  listUsers: GameUser[];
}

function LocalSection({
  idGame,
  isLocal,
  localUser,
  start,
  startCountdown,
  listUsers
}: LocalSectionProps) {
  const [lastClickTime, setLastClickTime] = useState<number>();
  const router = useRouter();
  const db = getDatabase();
  const {user: gUser} = useAuth();

  // function for start game
  const handleStart = () => {
    const refGame = ref(db, `games/${idGame}`);
    update(refGame, {gameStart: true});
  };

  // function for update clicks
  const handleClick = () => {
    const now = Date.now();

    // 1000ms / 25 clicks = 40ms
    if (lastClickTime && now - lastClickTime < 40) {
      router.push({pathname: "/", query: {suspicionOfHack: true}});
      return;
    }

    if (localUser.clicks !== undefined && gUser) {
      setLastClickTime(now);
      const refGame = ref(db, `games/${idGame}/listUsers/${gUser.uid}`);
      update(refGame, {clicks: localUser.clicks + 1});
    }
  };

  return (
    <>
      {!start && !startCountdown ? (
        isLocal ? (
          <h4>press start to play</h4>
        ) : (
          <h4>Waiting for host...</h4>
        )
      ) : (
        <h4>You have {localUser.clicks} clicks!</h4>
      )}
      <div className="d-flex justify-content-around">
        <button
          className="btn-click my-2"
          disabled={!start}
          onClick={handleClick}
        >
          Click
        </button>
        {isLocal && !start && !startCountdown && (
          <button
            className="btn-click my-2"
            disabled={!start && listUsers.length < 2}
            onClick={handleStart}
          >
            Start!
          </button>
        )}
      </div>
      <p className="mt-3 mb-0">{localUser.username}</p>
    </>
  );
}

export default LocalSection;
